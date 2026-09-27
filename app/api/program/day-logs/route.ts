import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  autoCompleteHittingFieldingFromLog,
  serializeDayLog,
} from "@/lib/program-day-log-server";
import {
  buildProgramDayInfoForProgramDay,
  getAllowedCompletionProgramDays,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import { loadEnrollmentPlanOverrideBundle } from "@/lib/program-plan-overrides-server";
import {
  EMPTY_GAME_STATS,
  validateDayLogNote,
  validateGameStats,
  type GameStatInput,
} from "@/lib/program-stats";
import { prisma } from "@/lib/prisma";

type CreateBody = {
  programDay?: number;
  type?: "GAME" | "PRACTICE";
  note?: string;
  opponent?: string;
  stats?: Partial<GameStatInput>;
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

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  const programDay = body?.programDay;
  const type = body?.type;

  if (!programDay || programDay < 1 || programDay > 84) {
    return NextResponse.json({ error: "Valid program day is required." }, { status: 400 });
  }

  if (type !== "GAME" && type !== "PRACTICE") {
    return NextResponse.json({ error: "Log type must be GAME or PRACTICE." }, { status: 400 });
  }

  const allowedDays = getAllowedCompletionProgramDays({ startDate: enrollment.startDate });
  if (!allowedDays.has(programDay)) {
    return NextResponse.json(
      { error: "You can only log game or practice days for today or yesterday." },
      { status: 400 },
    );
  }

  const validatedNote = validateDayLogNote(body?.note ?? "");
  if (!validatedNote.ok) {
    return NextResponse.json({ error: validatedNote.error }, { status: 400 });
  }

  if (type === "PRACTICE") {
    const existingPractice = await prisma.dayLog.findFirst({
      where: {
        enrollmentId: enrollment.id,
        programDay,
        type: "PRACTICE",
      },
    });
    if (existingPractice) {
      return NextResponse.json(
        { error: "You already logged practice for this day." },
        { status: 400 },
      );
    }
  }

  let statsInput = { ...EMPTY_GAME_STATS };
  let opponent: string | null = null;

  if (type === "GAME") {
    statsInput = {
      ...EMPTY_GAME_STATS,
      ...body?.stats,
    };
    const validatedStats = validateGameStats(statsInput);
    if (!validatedStats.ok) {
      return NextResponse.json({ error: validatedStats.error }, { status: 400 });
    }
    opponent = body?.opponent?.trim().slice(0, 60) || null;
  }

  const planInput = toEnrollmentPlanInput(enrollment);
  if (!planInput) {
    return NextResponse.json({ error: "Program enrollment is incomplete." }, { status: 400 });
  }

  const dayInfo = buildProgramDayInfoForProgramDay({ startDate: enrollment.startDate }, programDay);
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);

  const dayLog = await prisma.dayLog.create({
    data: {
      enrollmentId: enrollment.id,
      programDay,
      type,
      note: validatedNote.note,
      gameStats:
        type === "GAME"
          ? {
              create: {
                opponent,
                ...statsInput,
              },
            }
          : undefined,
    },
    include: { gameStats: true },
  });

  await autoCompleteHittingFieldingFromLog({
    enrollmentId: enrollment.id,
    programDay,
    dayLogId: dayLog.id,
    logType: type,
    note: validatedNote.note,
    planInput,
    dayInfo,
    overrideBundle,
  });

  return NextResponse.json({ dayLog: serializeDayLog(dayLog) });
}
