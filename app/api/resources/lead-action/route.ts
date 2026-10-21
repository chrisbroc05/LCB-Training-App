import { NextResponse } from "next/server";
import { performResourceLeadAction } from "@/lib/resources-lead-action-server";
import { LEAD_COOKIE_MAX_AGE_SECONDS, LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";

type Body = {
  resourceSlug?: string;
  firstName?: string;
  email?: string;
  role?: LeadRoleValue;
  leadId?: string;
};

function appendLeadCookie(response: NextResponse, leadId: string) {
  response.cookies.set(LEAD_COOKIE_NAME, leadId, {
    maxAge: LEAD_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null;
    const result = await performResourceLeadAction(request, body ?? {});

    const response = NextResponse.json(result);
    appendLeadCookie(response, result.leadId);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "MISSING_LEAD_FIELDS") {
      return NextResponse.json({ error: "First name, email, and role are required." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "TERMS_REQUIRED") {
      return NextResponse.json(
        { error: "Accept the latest terms in your account before checkout." },
        { status: 403 },
      );
    }
    console.error("[resources-lead-action]", error);
    return NextResponse.json({ error: "Unable to process request." }, { status: 500 });
  }
}
