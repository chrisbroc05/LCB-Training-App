import { NextResponse } from "next/server";
import { captureArticleLeadAndSendPdf } from "@/lib/articles-lead-server";
import { MarketingEmailBlockedError } from "@/lib/marketing-email-guard-server";
import { LEAD_COOKIE_MAX_AGE_SECONDS, LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";

type Body = {
  articleSlug?: string;
  firstName?: string;
  email?: string;
  role?: LeadRoleValue;
  playerAge13Plus?: boolean | null;
  parentEmail?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null;
    if (!body?.articleSlug || !body.firstName || !body.role) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await captureArticleLeadAndSendPdf({
      articleSlug: body.articleSlug,
      firstName: body.firstName,
      email: typeof body.email === "string" ? body.email : "",
      role: body.role,
      playerAge13Plus: body.playerAge13Plus,
      parentEmail: body.parentEmail,
    });

    const response = NextResponse.json({ success: true, leadId: result.leadId });
    response.cookies.set(LEAD_COOKIE_NAME, result.leadId, {
      maxAge: LEAD_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("LEAD_CAPTURE_INVALID:")) {
      return NextResponse.json(
        { error: error.message.replace(/^LEAD_CAPTURE_INVALID:/, "") },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "ARTICLE_NOT_FOUND") {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_ARTICLE") {
      return NextResponse.json({ error: "Invalid article." }, { status: 400 });
    }
    if (error instanceof MarketingEmailBlockedError) {
      console.error("[articles-lead-capture] marketing blocked", error.message);
      return NextResponse.json(
        { error: "Email delivery is temporarily unavailable. Try again later." },
        { status: 503 },
      );
    }
    console.error("[articles-lead-capture]", error);
    return NextResponse.json({ error: "Unable to send the printable plan." }, { status: 500 });
  }
}
