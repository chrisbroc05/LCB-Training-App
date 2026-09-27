import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getProgramDay } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ enrollmentId: string; taskId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId, taskId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    title?: string;
    target?: string;
    details?: string | null;
    drillIds?: string[];
    replacesTaskKey?: string | null;
  } | null;

  const existing = await prisma.customTask.findFirst({
    where: { id: taskId, enrollmentId },
    include: { enrollment: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Custom task not found." }, { status: 404 });
  }

  const schedule = getProgramDay(existing.enrollment);
  if (existing.programDay < schedule.programDay) {
    return NextResponse.json({ error: "Cannot edit past custom tasks." }, { status: 400 });
  }

  const task = await prisma.customTask.update({
    where: { id: taskId },
    data: {
      title: typeof body?.title === "string" ? body.title.trim() : undefined,
      target: typeof body?.target === "string" ? body.target.trim() : undefined,
      details:
        body?.details === null
          ? null
          : typeof body?.details === "string"
            ? body.details.trim() || null
            : undefined,
      drillIds: Array.isArray(body?.drillIds) ? body.drillIds.filter(Boolean) : undefined,
      replacesTaskKey:
        body?.replacesTaskKey === null
          ? null
          : typeof body?.replacesTaskKey === "string"
            ? body.replacesTaskKey.trim() || null
            : undefined,
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId, taskId } = await context.params;

  const existing = await prisma.customTask.findFirst({
    where: { id: taskId, enrollmentId },
    include: { enrollment: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Custom task not found." }, { status: 404 });
  }

  const schedule = getProgramDay(existing.enrollment);
  if (existing.programDay < schedule.programDay) {
    return NextResponse.json({ error: "Cannot delete past custom tasks." }, { status: 400 });
  }

  await prisma.customTask.delete({ where: { id: taskId } });

  await prisma.taskCompletion.deleteMany({
    where: {
      enrollmentId,
      programDay: existing.programDay,
      taskKey: `d${existing.programDay}-custom-${existing.id}`,
    },
  });

  return NextResponse.json({ success: true });
}
