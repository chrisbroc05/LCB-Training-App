import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveLegalAcceptance } from "@/lib/legal-server";
import { parseLegalPlayerAge } from "@/lib/legal-shared";

type AcceptBody = {
  acceptedByName?: string;
  acceptedAsParent?: boolean;
  playerAge?: number | string;
  parentConsentName?: string | null;
  parentConsentEmail?: string | null;
  mediaConsent?: boolean;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as AcceptBody;
  const playerAge = parseLegalPlayerAge(body.playerAge);
  if (playerAge == null) {
    return NextResponse.json({ error: "Enter a valid player age (5-25)." }, { status: 400 });
  }

  const acceptedByName = body.acceptedByName?.trim() ?? "";
  if (!acceptedByName) {
    return NextResponse.json({ error: "Enter the full name of the person agreeing." }, { status: 400 });
  }

  if (typeof body.acceptedAsParent !== "boolean") {
    return NextResponse.json(
      { error: "Select whether you are the player or the parent or guardian." },
      { status: 400 },
    );
  }

  if (playerAge < 18) {
    const parentConsentName = body.parentConsentName?.trim() ?? "";
    const parentConsentEmail = body.parentConsentEmail?.trim().toLowerCase() ?? "";
    if (!parentConsentName || !parentConsentEmail) {
      return NextResponse.json(
        { error: "Parent or guardian name and email are required for players under 18." },
        { status: 400 },
      );
    }

    if (!body.acceptedAsParent) {
      return NextResponse.json(
        { error: "A parent or guardian must agree for players under 18." },
        { status: 400 },
      );
    }
  }

  const updated = await saveLegalAcceptance(session.user.id, {
    acceptedByName,
    acceptedAsParent: body.acceptedAsParent,
    playerAge,
    parentConsentName: body.parentConsentName?.trim() ?? null,
    parentConsentEmail: body.parentConsentEmail?.trim().toLowerCase() ?? null,
    mediaConsent: Boolean(body.mediaConsent),
  });

  return NextResponse.json({
    termsVersion: updated.termsVersion,
    termsAcceptedAt: updated.termsAcceptedAt?.toISOString() ?? null,
    acceptedByName: updated.acceptedByName,
    acceptedAsParent: updated.acceptedAsParent,
    playerAge: updated.playerAge,
    parentConsentConfirmedAt: updated.parentConsentConfirmedAt?.toISOString() ?? null,
    mediaConsent: updated.mediaConsent,
    mediaConsentUpdatedAt: updated.mediaConsentUpdatedAt?.toISOString() ?? null,
  });
}
