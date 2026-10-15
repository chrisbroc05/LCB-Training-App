import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { serializeEnrollmentTracks, upsertEnrollmentTrack } from "@/lib/program-tracks-server";
import { prisma } from "@/lib/prisma";

type TrackBody = {
  trackKey?: string;
  active?: boolean;
  note?: string | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ enrollmentId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId } = await context.params;
  const enrollment = await prisma.programEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as TrackBody | null;
  const trackKey = body?.trackKey?.trim();
  if (!trackKey) {
    return NextResponse.json({ error: "Track key is required." }, { status: 400 });
  }

  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "Active flag is required." }, { status: 400 });
  }

  const result = await upsertEnrollmentTrack({
    enrollmentId,
    trackKey,
    active: body.active,
    note: body.note,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const tracks = await prisma.enrollmentTrack.findMany({
    where: { enrollmentId },
    orderBy: { trackKey: "asc" },
  });

  return NextResponse.json({ ok: true, tracks: serializeEnrollmentTracks(tracks) });
}
