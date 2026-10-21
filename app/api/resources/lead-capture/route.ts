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

/** @deprecated Use POST /api/resources/lead-action */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null;
    const result = await performResourceLeadAction(request, body ?? {});
    const response =
      result.action === "download"
        ? NextResponse.json({
            success: true,
            downloadUrl: result.downloadUrl,
            leadId: result.leadId,
          })
        : NextResponse.json({ error: "Use lead-action for this resource." }, { status: 400 });

    if (result.action === "download") {
      response.cookies.set(LEAD_COOKIE_NAME, result.leadId, {
        maxAge: LEAD_COOKIE_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return response;
  } catch (error) {
    console.error("[resources-lead-capture]", error);
    return NextResponse.json({ error: "Unable to process download request." }, { status: 500 });
  }
}
