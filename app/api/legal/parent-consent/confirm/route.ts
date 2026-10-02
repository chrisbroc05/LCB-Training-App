import { NextResponse } from "next/server";
import { confirmParentConsent } from "@/lib/legal-server";
import { verifyParentConsentConfirmToken } from "@/lib/parent-consent-token";

type ConfirmBody = {
  token?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ConfirmBody;
  const token = body.token?.trim() ?? "";

  const userId = verifyParentConsentConfirmToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
  }

  const result = await confirmParentConsent(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    alreadyConfirmed: result.alreadyConfirmed,
  });
}
