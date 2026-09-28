import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadEnrollmentGameStats, serializeDayLog } from "@/lib/program-day-log-server";
import {
  aggregateGameStats,
  computeAvg,
  computeObp,
  computeSlg,
  formatGameLine,
  formatGameSummary,
  formatRate,
} from "@/lib/program-stats";
import { formatWeekdayDate } from "@/lib/format-date";
import {
  formatProgramStartDateKey,
  getDateForProgramDay,
  getWeekdayLabelForProgramDay,
} from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  const gameLogs = await loadEnrollmentGameStats(enrollment.id);
  const totals = aggregateGameStats(gameLogs.map((log) => log.stats));

  const practiceLogs = await prisma.dayLog.findMany({
    where: { enrollmentId: enrollment.id, type: "PRACTICE" },
    orderBy: [{ programDay: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    totals: {
      games: totals.games,
      atBats: totals.atBats,
      hits: totals.hits,
      doubles: totals.doubles,
      triples: totals.triples,
      homeRuns: totals.homeRuns,
      walks: totals.walks,
      hitByPitch: totals.hitByPitch,
      runs: totals.runs,
      rbis: totals.rbis,
      strikeouts: totals.strikeouts,
      stolenBases: totals.stolenBases,
      errors: totals.errors,
      avg: formatRate(computeAvg(totals)),
      obp: formatRate(computeObp(totals)),
      slg: formatRate(computeSlg(totals)),
    },
    gameLogs: gameLogs.map((log) => ({
      id: log.id,
      programDay: log.programDay,
      note: log.note,
      createdAt: log.createdAt,
      opponent: log.opponent,
      line: formatGameLine(log.stats),
      summary: formatGameSummary(log.stats, log.opponent),
      dateLabel:
        enrollment.startDate && log.programDay > 0
          ? formatWeekdayDate(getDateForProgramDay(enrollment.startDate, log.programDay))
          : `Day ${log.programDay}`,
      weekdayShort:
        enrollment.startDate && log.programDay > 0
          ? getWeekdayLabelForProgramDay(enrollment.startDate, log.programDay)
          : "?",
      startDate: enrollment.startDate
        ? formatProgramStartDateKey(enrollment.startDate)
        : null,
    })),
    practiceLogs: practiceLogs.map((log) => serializeDayLog({ ...log, gameStats: null })),
  });
}
