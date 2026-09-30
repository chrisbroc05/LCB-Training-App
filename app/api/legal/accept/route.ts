import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveLegalAcceptance } from "@/lib/legal-server";
import { validateAcceptedByName } from "@/lib/legal-shared";

type AcceptBody = {
  acceptedByName?: string;
  acceptedAsParent?: boolean;
  mediaConsent?: boolean;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as AcceptBody;
  const acceptedByName = body.acceptedByName?.trim() ?? "";
  const nameError = validateAcceptedByName(acceptedByName);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  if (typeof body.acceptedAsParent !== "boolean") {
    return NextResponse.json(
      { error: "Select whether you are the player or the parent or guardian." },
      { status: 400 },
    );
  }

  const updated = await saveLegalAcceptance(session.user.id, {
    acceptedByName,
    acceptedAsParent: body.acceptedAsParent,
    mediaConsent: Boolean(body.mediaConsent),
  });

  return NextResponse.json({
    termsVersion: updated.termsVersion,
    termsAcceptedAt: updated.termsAcceptedAt?.toISOString() ?? null,
    acceptedByName: updated.acceptedByName,
    acceptedAsParent: updated.acceptedAsParent,
    mediaConsent: updated.mediaConsent,
    mediaConsentUpdatedAt: updated.mediaConsentUpdatedAt?.toISOString() ?? null,
  });
}
