import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteAutoCompletionsForLog,
  refreshAutoCompletionsForLog,
  serializeDayLog,
} from "@/lib/program-day-log-server";
import { getAllowedCompletionProgramDays } from "@/lib/program-today-server";
import {
  EMPTY_GAME_STATS,
  validateDayLogNote,
  validateGameStats,
  type GameStatInput,
} from "@/lib/program-stats";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateBody = {
  note?: string;
  opponent?: string;
  stats?: Partial<GameStatInput>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment || !enrollment.onboardingCompletedAt) {
    return NextResponse.json({ error: "Program setup is not complete." }, { status: 409 });
  }

  const existing = await prisma.dayLog.findFirst({
    where: { id, enrollmentId: enrollment.id },
    include: { gameStats: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Day log not found." }, { status: 404 });
  }

  const allowedDays = getAllowedCompletionProgramDays({ startDate: enrollment.startDate });
  if (!allowedDays.has(existing.programDay)) {
    return NextResponse.json(
      { error: "You can only edit game or practice logs for today or yesterday." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  const validatedNote = validateDayLogNote(body?.note ?? existing.note);
  if (!validatedNote.ok) {
    return NextResponse.json({ error: validatedNote.error }, { status: 400 });
  }

  if (existing.type === "GAME") {
    const statsInput: GameStatInput = {
      ...EMPTY_GAME_STATS,
      ...(existing.gameStats
        ? {
            atBats: existing.gameStats.atBats,
            hits: existing.gameStats.hits,
            doubles: existing.gameStats.doubles,
            triples: existing.gameStats.triples,
            homeRuns: existing.gameStats.homeRuns,
            walks: existing.gameStats.walks,
            hitByPitch: existing.gameStats.hitByPitch,
            runs: existing.gameStats.runs,
            rbis: existing.gameStats.rbis,
            strikeouts: existing.gameStats.strikeouts,
            stolenBases: existing.gameStats.stolenBases,
            errors: existing.gameStats.errors,
          }
        : {}),
      ...body?.stats,
    };
    const validatedStats = validateGameStats(statsInput);
    if (!validatedStats.ok) {
      return NextResponse.json({ error: validatedStats.error }, { status: 400 });
    }

    const opponent =
      body?.opponent !== undefined
        ? body.opponent.trim().slice(0, 60) || null
        : existing.gameStats?.opponent ?? null;

    await prisma.gameStats.update({
      where: { dayLogId: existing.id },
      data: {
        opponent,
        ...statsInput,
      },
    });
  }

  const dayLog = await prisma.dayLog.update({
    where: { id: existing.id },
    data: { note: validatedNote.note },
    include: { gameStats: true },
  });

  await refreshAutoCompletionsForLog({
    dayLogId: dayLog.id,
    logType: dayLog.type,
    note: validatedNote.note,
  });

  return NextResponse.json({ dayLog: serializeDayLog(dayLog) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment || !enrollment.onboardingCompletedAt) {
    return NextResponse.json({ error: "Program setup is not complete." }, { status: 409 });
  }

  const existing = await prisma.dayLog.findFirst({
    where: { id, enrollmentId: enrollment.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Day log not found." }, { status: 404 });
  }

  const allowedDays = getAllowedCompletionProgramDays({ startDate: enrollment.startDate });
  if (!allowedDays.has(existing.programDay)) {
    return NextResponse.json(
      { error: "You can only delete game or practice logs for today or yesterday." },
      { status: 400 },
    );
  }

  await deleteAutoCompletionsForLog(existing.id);
  await prisma.dayLog.delete({ where: { id: existing.id } });

  return NextResponse.json({ success: true });
}
