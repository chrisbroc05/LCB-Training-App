import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { updateWaiverMediaOptOutAll } from "@/lib/legal-server";
import { resolveMediaDisplayStatus } from "@/lib/media-consent-shared";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ signatureId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { signatureId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { mediaOptOutAll?: boolean };
  if (typeof body.mediaOptOutAll !== "boolean") {
    return NextResponse.json({ error: "mediaOptOutAll must be true or false." }, { status: 400 });
  }

  const updated = await updateWaiverMediaOptOutAll(signatureId, body.mediaOptOutAll);

  return NextResponse.json({
    mediaConsent: updated.mediaConsent,
    mediaOptOutAll: updated.mediaOptOutAll,
    mediaDisplayStatus: resolveMediaDisplayStatus({
      mediaConsent: updated.mediaConsent,
      mediaOptOutAll: updated.mediaOptOutAll,
    }),
  });
}
