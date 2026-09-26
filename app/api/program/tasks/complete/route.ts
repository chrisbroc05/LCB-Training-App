import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  assertTaskExistsForDay,
  buildProgramDayInfoForProgramDay,
  getAllowedCompletionProgramDays,
  toEnrollmentPlanInput,
  validateTaskNote,
} from "@/lib/program-today-server";
import { prisma } from "@/lib/prisma";

type CompleteBody = {
  programDay?: number;
  taskKey?: string;
  note?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment || !enrollment.onboardingCompletedAt) {
    return NextResponse.json({ error: "Program setup is not complete." }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as CompleteBody | null;
  const programDay = body?.programDay;
  const taskKey = body?.taskKey?.trim();
  const note = body?.note ?? "";

  if (!programDay || !taskKey) {
    return NextResponse.json({ error: "Program day and task key are required." }, { status: 400 });
  }

  const allowedDays = getAllowedCompletionProgramDays({ startDate: enrollment.startDate });
  if (!allowedDays.has(programDay)) {
    return NextResponse.json(
      { error: "You can only complete tasks for today or yesterday." },
      { status: 400 },
    );
  }

  const planInput = toEnrollmentPlanInput(enrollment);
  if (!planInput) {
    return NextResponse.json({ error: "Program enrollment is incomplete." }, { status: 400 });
  }

  const dayInfo = buildProgramDayInfoForProgramDay({ startDate: enrollment.startDate }, programDay);
  const task = assertTaskExistsForDay(planInput, dayInfo, taskKey);
  if (!task) {
    return NextResponse.json({ error: "Task not found for this program day." }, { status: 400 });
  }

  const validated = validateTaskNote(task, note);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const completion = await prisma.taskCompletion.upsert({
    where: {
      enrollmentId_programDay_taskKey: {
        enrollmentId: enrollment.id,
        programDay,
        taskKey,
      },
    },
    create: {
      enrollmentId: enrollment.id,
      programDay,
      taskKey,
      taskType: task.type,
      note: validated.note,
    },
    update: {
      note: validated.note,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    completion: {
      taskKey: completion.taskKey,
      note: completion.note,
      completedAt: completion.completedAt.toISOString(),
    },
  });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment || !enrollment.onboardingCompletedAt) {
    return NextResponse.json({ error: "Program setup is not complete." }, { status: 409 });
  }

  const { searchParams } = new URL(request.url);
  const programDay = Number(searchParams.get("programDay"));
  const taskKey = searchParams.get("taskKey")?.trim();

  if (!programDay || !taskKey) {
    return NextResponse.json({ error: "Program day and task key are required." }, { status: 400 });
  }

  const allowedDays = getAllowedCompletionProgramDays({ startDate: enrollment.startDate });
  if (!allowedDays.has(programDay)) {
    return NextResponse.json(
      { error: "You can only undo tasks for today or yesterday." },
      { status: 400 },
    );
  }

  await prisma.taskCompletion.deleteMany({
    where: {
      enrollmentId: enrollment.id,
      programDay,
      taskKey,
    },
  });

  return NextResponse.json({ success: true });
}
