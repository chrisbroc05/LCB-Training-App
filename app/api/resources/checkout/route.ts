import { NextResponse } from "next/server";
import { performResourceLeadAction } from "@/lib/resources-lead-action-server";
import type { LeadRoleValue } from "@/lib/resources-shared";

/** Legacy endpoint: prefer POST /api/resources/lead-action */
type Body = {
  resourceSlug?: string;
  email?: string;
  firstName?: string;
  role?: LeadRoleValue;
  leadId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null;
    const result = await performResourceLeadAction(request, body ?? {});
    if (result.action !== "checkout") {
      return NextResponse.json({ error: "Not a paid resource." }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("[resources-checkout]", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
