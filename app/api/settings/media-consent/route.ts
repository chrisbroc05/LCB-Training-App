import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUserMediaConsent } from "@/lib/legal-server";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { mediaConsent?: boolean };
  if (typeof body.mediaConsent !== "boolean") {
    return NextResponse.json({ error: "mediaConsent must be true or false." }, { status: 400 });
  }

  const updated = await updateUserMediaConsent(session.user.id, body.mediaConsent);

  return NextResponse.json({
    mediaConsent: updated.mediaConsent,
    mediaConsentUpdatedAt: updated.mediaConsentUpdatedAt?.toISOString() ?? null,
  });
}
