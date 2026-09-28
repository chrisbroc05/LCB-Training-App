import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { sendPlanUpdatePush } from "@/lib/push-instant";
import { getProgramDay } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ enrollmentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    cueId?: string;
    note?: string;
    target?: "this_week" | "next_week";
  } | null;

  const enrollment = await prisma.programEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  const cueId = body?.cueId?.trim();
  const note = body?.note?.trim() ?? "";
  if (!cueId) {
    return NextResponse.json({ error: "Cue is required." }, { status: 400 });
  }
  if (note.length > 300) {
    return NextResponse.json({ error: "Note must be 300 characters or less." }, { status: 400 });
  }

  const cue = await prisma.coachCue.findUnique({ where: { id: cueId } });
  if (!cue) {
    return NextResponse.json({ error: "Cue not found." }, { status: 404 });
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate });
  let weekNumber = schedule.weekNumber;
  if (body?.target === "next_week") {
    weekNumber = Math.min(12, weekNumber + 1);
  }

  if (weekNumber < 1) {
    return NextResponse.json({ error: "Program has not started yet." }, { status: 400 });
  }

  const override = await prisma.weekFocusOverride.upsert({
    where: {
      enrollmentId_weekNumber: {
        enrollmentId,
        weekNumber,
      },
    },
    create: {
      enrollmentId,
      weekNumber,
      cueId,
      note,
    },
    update: {
      cueId,
      note,
    },
    include: { cue: true },
  });

  void sendPlanUpdatePush({
    userId: enrollment.userId,
    enrollmentId,
    dedupeSuffix: `focus-week-${weekNumber}`,
  });

  return NextResponse.json({ override });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId } = await context.params;
  const { searchParams } = new URL(request.url);
  const weekNumber = Number(searchParams.get("weekNumber"));

  if (!weekNumber || weekNumber < 1 || weekNumber > 12) {
    return NextResponse.json({ error: "Valid week number is required." }, { status: 400 });
  }

  await prisma.weekFocusOverride.deleteMany({
    where: {
      enrollmentId,
      weekNumber,
    },
  });

  return NextResponse.json({ success: true });
}
