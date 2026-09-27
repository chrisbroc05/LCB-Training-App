import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
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
    programDay?: number;
    title?: string;
    target?: string;
    details?: string;
    drillIds?: string[];
    replacesTaskKey?: string | null;
  } | null;

  const enrollment = await prisma.programEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }

  const programDay = body?.programDay;
  const title = body?.title?.trim();
  const target = body?.target?.trim();
  const details = body?.details?.trim() || null;
  const drillIds = Array.isArray(body?.drillIds) ? body.drillIds.filter(Boolean) : [];

  if (!programDay || programDay < 1 || programDay > 84) {
    return NextResponse.json({ error: "Valid program day is required." }, { status: 400 });
  }

  const schedule = getProgramDay(enrollment);
  if (programDay < schedule.programDay) {
    return NextResponse.json({ error: "Cannot add tasks for past days." }, { status: 400 });
  }

  if (!title || !target) {
    return NextResponse.json({ error: "Title and target are required." }, { status: 400 });
  }

  const task = await prisma.customTask.create({
    data: {
      enrollmentId,
      programDay,
      title,
      target,
      details,
      drillIds,
      replacesTaskKey: body?.replacesTaskKey?.trim() || null,
    },
  });

  return NextResponse.json({ task });
}
