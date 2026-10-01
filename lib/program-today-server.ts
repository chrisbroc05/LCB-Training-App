import "server-only";

import { formatReflectionNote, parseReflectionNote } from "@/lib/program-content";
import { validateProgramNote } from "@/lib/program-note-shared";
import {
  findDailyTask,
  getDailyPlan,
  getTaskKeysForDay,
  type ProgramDailyTask,
  type ProgramEnrollmentPlanInput,
} from "@/lib/program-daily-plan";
import { getWeekFocusNote } from "@/lib/program-plan-overrides";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import type { ProgramFocusArea, ProgramEquipmentOption } from "@/lib/program-enrollment-shared";
import { computeProgramStreak, getDayOfWeekForProgramDay } from "@/lib/program-streak-shared";
import {
  formatProgramStartDateKey,
  getChicagoMondayStart,
  getDateForProgramDay,
  getProgramDay,
  getProgramDayStartProgramDay,
  getProgramWeekStartProgramDay,
  getWeekdayLabelForProgramDay,
  getWeekdayNameForProgramDay,
  type ProgramDayInfo,
} from "@/lib/program-schedule";
import { getUnwatchedCoachVideoCount } from "@/lib/coach-video-server";
import {
  loadEnrollmentGameStats,
  serializeDayLog,
} from "@/lib/program-day-log-server";
import {
  aggregateGameStats,
  computeAvg,
  computeObp,
  formatGameLine,
  formatGameSummary,
  formatRate,
} from "@/lib/program-stats";
import { prisma } from "@/lib/prisma";

export type ProgramTaskCompletionRecord = {
  taskKey: string;
  note: string;
  completedAt: string;
};

export type ProgramTodayTask = ProgramDailyTask & {
  completed: boolean;
  note?: string;
  completedAt?: string;
  countedFromLog?: "game" | "practice" | null;
};

export type ProgramWeekDayStatus = {
  programDay: number;
  dayOfWeek: number;
  weekdayLabel: string;
  weekdayName: string;
  status: "complete" | "partial" | "missed" | "upcoming" | "rest" | "not_started";
  isToday: boolean;
  tappable: boolean;
  editable: boolean;
  completionRatio: number;
};

export function getAllowedCompletionProgramDays(
  enrollment: { startDate: Date | null },
  now = new Date(),
) {
  const todayInfo = getProgramDay(enrollment, now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayInfo = getProgramDay(enrollment, yesterday);
  const allowed = new Set<number>();

  if (todayInfo.programDay > 0) {
    allowed.add(todayInfo.programDay);
  }

  if (yesterdayInfo.programDay > 0) {
    allowed.add(yesterdayInfo.programDay);
  }

  return allowed;
}

export function toEnrollmentPlanInput(enrollment: {
  ageGroup: string | null;
  focusAreas: string[];
  equipment: string[];
  strengthVariant?: string | null;
  seasonMode: string | null;
  knownFor: string | null;
}): ProgramEnrollmentPlanInput | null {
  if (!enrollment.ageGroup || !enrollment.seasonMode) {
    return null;
  }

  return {
    ageGroup: enrollment.ageGroup as ProgramEnrollmentPlanInput["ageGroup"],
    focusAreas: enrollment.focusAreas as ProgramFocusArea[],
    equipment: enrollment.equipment as ProgramEquipmentOption[],
    strengthVariant: enrollment.strengthVariant as ProgramEnrollmentPlanInput["strengthVariant"],
    seasonMode: enrollment.seasonMode as ProgramEnrollmentPlanInput["seasonMode"],
    knownFor: enrollment.knownFor,
  };
}

export function buildProgramDayInfoForProgramDay(
  enrollment: { startDate: Date | null },
  programDay: number,
): ProgramDayInfo {
  if (!enrollment.startDate || programDay <= 0) {
    return getProgramDay(enrollment);
  }

  const target = getDateForProgramDay(enrollment.startDate, programDay);
  return getProgramDay(enrollment, target);
}

export async function hasWeeklyVideoSent(userId: string, now = new Date()) {
  const weekStart = getChicagoMondayStart(now);

  const [swingCount, mentalCount] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: {
        userId,
        createdAt: { gte: weekStart },
      },
    }),
    prisma.mentalGameSubmission.count({
      where: {
        userId,
        createdAt: { gte: weekStart },
      },
    }),
  ]);

  return swingCount + mentalCount > 0;
}

export function validateTaskNote(task: ProgramDailyTask, note: string) {
  const trimmed = note.trim();

  if (task.type === "reflection") {
    const parsed = parseReflectionNote(trimmed);
    if (!parsed.bestRep || !parsed.stillHard || !parsed.knownForNext) {
      return { ok: false as const, error: "All three reflection answers are required." };
    }

    for (const value of [parsed.bestRep, parsed.stillHard, parsed.knownForNext]) {
      const validatedField = validateProgramNote(value);
      if (!validatedField.ok) {
        return validatedField;
      }
    }

    return {
      ok: true as const,
      note: formatReflectionNote(parsed),
    };
  }

  const validated = validateProgramNote(trimmed);
  if (!validated.ok) {
    return validated;
  }

  return { ok: true as const, note: validated.note };
}

export async function buildProgramTodayPayload(params: {
  enrollment: {
    id: string;
    startDate: Date | null;
    ageGroup: string | null;
    focusAreas: string[];
    equipment: string[];
    seasonMode: string | null;
    knownFor: string | null;
    onboardingCompletedAt: Date | null;
  };
  userId: string;
  viewedProgramDay?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const todayInfo = getProgramDay({ startDate: params.enrollment.startDate }, now);
  const viewedProgramDay = params.viewedProgramDay ?? todayInfo.programDay;
  const viewedDayInfo =
    viewedProgramDay > 0
      ? buildProgramDayInfoForProgramDay({ startDate: params.enrollment.startDate }, viewedProgramDay)
      : todayInfo;

  const planInput = toEnrollmentPlanInput(params.enrollment);
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(params.enrollment.id);
  const viewedOverrides =
    viewedDayInfo.weekNumber > 0
      ? buildOverridesForWeekAndDay(
          overrideBundle,
          viewedDayInfo.weekNumber,
          viewedDayInfo.programDay,
        )
      : undefined;
  const viewedTasks =
    planInput && viewedDayInfo.programDay > 0 && viewedDayInfo.dayOfWeek !== 7
      ? getDailyPlan(planInput, viewedDayInfo, viewedOverrides)
      : [];

  const previewDayInfo =
    todayInfo.isBeforeStart && params.enrollment.startDate
      ? buildProgramDayInfoForProgramDay(
          { startDate: params.enrollment.startDate },
          getProgramDayStartProgramDay(params.enrollment.startDate),
        )
      : null;
  const previewOverrides =
    previewDayInfo && previewDayInfo.weekNumber > 0
      ? buildOverridesForWeekAndDay(
          overrideBundle,
          previewDayInfo.weekNumber,
          previewDayInfo.programDay,
        )
      : undefined;
  const previewTasks =
    planInput && previewDayInfo
      ? getDailyPlan(planInput, previewDayInfo, previewOverrides)
      : [];

  const completions = await prisma.taskCompletion.findMany({
    where: { enrollmentId: params.enrollment.id },
    select: {
      programDay: true,
      taskKey: true,
      note: true,
      completedAt: true,
      sourceDayLogId: true,
      sourceDayLog: {
        select: { type: true },
      },
    },
  });

  const completionMap = new Map<
    string,
    ProgramTaskCompletionRecord & {
      countedFromLog?: "game" | "practice" | null;
    }
  >();
  for (const completion of completions) {
    completionMap.set(`${completion.programDay}:${completion.taskKey}`, {
      taskKey: completion.taskKey,
      note: completion.note,
      completedAt: completion.completedAt.toISOString(),
      countedFromLog: completion.sourceDayLog
        ? completion.sourceDayLog.type === "GAME"
          ? "game"
          : "practice"
        : null,
    });
  }

  const tasks: ProgramTodayTask[] = viewedTasks.map((task) => {
    const saved = completionMap.get(`${viewedDayInfo.programDay}:${task.key}`);
    return {
      ...task,
      completed: Boolean(saved),
      note: saved?.note,
      completedAt: saved?.completedAt,
      countedFromLog: saved?.countedFromLog ?? null,
    };
  });

  const dayLogs = await prisma.dayLog.findMany({
    where: {
      enrollmentId: params.enrollment.id,
      programDay: viewedDayInfo.programDay,
    },
    include: { gameStats: true },
    orderBy: { createdAt: "asc" },
  });

  const allGameLogs = await loadEnrollmentGameStats(params.enrollment.id);
  const seasonTotals = aggregateGameStats(allGameLogs.map((log) => log.stats));
  const seasonStats =
    seasonTotals.games > 0
      ? {
          games: seasonTotals.games,
          avg: formatRate(computeAvg(seasonTotals)),
          obp: formatRate(computeObp(seasonTotals)),
          hits: seasonTotals.hits,
          rbis: seasonTotals.rbis,
          stolenBases: seasonTotals.stolenBases,
        }
      : null;

  const completedWorkDays = new Set<number>();
  if (planInput && params.enrollment.startDate) {
    for (let day = 1; day <= Math.min(todayInfo.programDay, 84); day += 1) {
      const dayInfo = buildProgramDayInfoForProgramDay(
        { startDate: params.enrollment.startDate },
        day,
      );

      if (dayInfo.isBeforeStart || dayInfo.dayOfWeek === 7) {
        continue;
      }
      const dayOverrides = buildOverridesForWeekAndDay(
        overrideBundle,
        dayInfo.weekNumber,
        day,
      );
      const expectedKeys = getTaskKeysForDay(planInput, dayInfo, dayOverrides);
      if (expectedKeys.length === 0) {
        continue;
      }

      const completedCount = expectedKeys.filter((key) =>
        completionMap.has(`${day}:${key}`),
      ).length;

      if (completedCount === expectedKeys.length) {
        completedWorkDays.add(day);
      }
    }
  }

  const streak = computeProgramStreak({
    currentProgramDay: todayInfo.programDay,
    completedWorkDays,
  });

  const anchorProgramDay =
    viewedDayInfo.programDay > 0 ? viewedDayInfo.programDay : todayInfo.programDay;
  const anchorWeekNumber =
    anchorProgramDay > 0 ? Math.min(12, Math.ceil(anchorProgramDay / 7)) : 1;
  const weekStartProgramDay = getProgramWeekStartProgramDay(anchorWeekNumber);
  const weekEndProgramDay = Math.min(84, weekStartProgramDay + 6);
  const weekDays: ProgramWeekDayStatus[] = [];

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayInfo = getProgramDay({ startDate: params.enrollment.startDate }, yesterday);
  const startDate = params.enrollment.startDate;

  const weekDayLogs = await prisma.dayLog.findMany({
    where: {
      enrollmentId: params.enrollment.id,
      programDay: {
        gte: weekStartProgramDay,
        lte: weekEndProgramDay,
      },
    },
    select: { programDay: true },
  });
  const dayLogProgramDays = new Set(weekDayLogs.map((log) => log.programDay));

  for (let offset = 0; offset < 7; offset += 1) {
    const programDay = weekStartProgramDay + offset;
    const dayOfWeek = offset + 1;
    const weekdayLabel = getWeekdayLabelForProgramDay(startDate ?? new Date(), programDay);
    const weekdayName = getWeekdayNameForProgramDay(startDate ?? new Date(), programDay);
    const isToday = programDay === todayInfo.programDay;

    if (programDay > 84) {
      weekDays.push({
        programDay,
        dayOfWeek,
        weekdayLabel,
        weekdayName,
        status: "upcoming",
        isToday: false,
        tappable: false,
        editable: false,
        completionRatio: 0,
      });
      continue;
    }

    const dayInfo = buildProgramDayInfoForProgramDay(
      { startDate: params.enrollment.startDate },
      programDay,
    );

    if (dayInfo.isBeforeStart) {
      weekDays.push({
        programDay,
        dayOfWeek,
        weekdayLabel,
        weekdayName,
        status: "not_started",
        isToday,
        tappable: false,
        editable: false,
        completionRatio: 0,
      });
      continue;
    }

    const editable =
      yesterdayInfo.programDay > 0 &&
      programDay === yesterdayInfo.programDay &&
      programDay !== todayInfo.programDay;
    const tappable = programDay > 0 && programDay <= todayInfo.programDay;

    if (dayOfWeek === 7) {
      weekDays.push({
        programDay,
        dayOfWeek,
        weekdayLabel,
        weekdayName,
        status: dayLogProgramDays.has(programDay) ? "complete" : "rest",
        isToday,
        tappable,
        editable: false,
        completionRatio: dayLogProgramDays.has(programDay) ? 1 : 0,
      });
      continue;
    }

    const dayOverrides =
      planInput && dayInfo.weekNumber > 0
        ? buildOverridesForWeekAndDay(overrideBundle, dayInfo.weekNumber, programDay)
        : undefined;
    const expectedKeys =
      planInput && dayInfo.programDay > 0
        ? getTaskKeysForDay(planInput, dayInfo, dayOverrides)
        : [];
    const completedCount = expectedKeys.filter((key) =>
      completionMap.has(`${programDay}:${key}`),
    ).length;
    const completionRatio =
      expectedKeys.length > 0 ? completedCount / expectedKeys.length : 0;

    let status: ProgramWeekDayStatus["status"] = "upcoming";
    if (programDay > todayInfo.programDay) {
      status = "upcoming";
    } else if (expectedKeys.length > 0 && completedCount === expectedKeys.length) {
      status = "complete";
    } else if (completedCount > 0) {
      status = "partial";
    } else if (programDay < todayInfo.programDay) {
      status = "missed";
    } else {
      status = "upcoming";
    }

    weekDays.push({
      programDay,
      dayOfWeek,
      weekdayLabel,
      weekdayName,
      status,
      isToday,
      tappable,
      editable,
      completionRatio,
    });
  }

  const canCompleteTasks =
    viewedDayInfo.programDay === todayInfo.programDay ||
    (yesterdayInfo.programDay > 0 && viewedDayInfo.programDay === yesterdayInfo.programDay);

  const allTasksComplete =
    tasks.length > 0 && tasks.every((task) => task.completed) && viewedProgramDay === todayInfo.programDay;

  const [weeklyVideoSent, unwatchedCoachVideoCount] = await Promise.all([
    hasWeeklyVideoSent(params.userId, now),
    getUnwatchedCoachVideoCount(params.userId),
  ]);

  const weekFocusCue = viewedOverrides?.focusOverride?.cueLabel ?? null;
  const weekFocusNote = getWeekFocusNote(viewedOverrides);

  const headerWeekNumber =
    viewedDayInfo.weekNumber > 0 ? viewedDayInfo.weekNumber : todayInfo.weekNumber || 1;
  const headerWeekdayName =
    params.enrollment.startDate && viewedDayInfo.programDay > 0
      ? getWeekdayNameForProgramDay(params.enrollment.startDate, viewedDayInfo.programDay)
      : todayInfo.programDay > 0 && params.enrollment.startDate
        ? getWeekdayNameForProgramDay(params.enrollment.startDate, todayInfo.programDay)
        : "Today";

  return {
    todayProgramDay: todayInfo.programDay,
    viewedProgramDay: viewedDayInfo.programDay,
    programDayInfo: viewedDayInfo,
    headerLabel: `${headerWeekdayName} - Week ${headerWeekNumber} of 12`,
    progressWeekNumber: todayInfo.weekNumber > 0 ? todayInfo.weekNumber : 0,
    tasks,
    previewTasks,
    streak,
    weekDays,
    allTasksComplete,
    weeklyVideoSent,
    unwatchedCoachVideoCount,
    weekFocusCue,
    weekFocusNote,
    dayLogs: dayLogs.map((log) => ({
      ...serializeDayLog(log),
      summary:
        log.type === "GAME" && log.gameStats
          ? formatGameSummary(
              {
                atBats: log.gameStats.atBats,
                hits: log.gameStats.hits,
                doubles: log.gameStats.doubles,
                triples: log.gameStats.triples,
                homeRuns: log.gameStats.homeRuns,
                walks: log.gameStats.walks,
                hitByPitch: log.gameStats.hitByPitch,
                runs: log.gameStats.runs,
                rbis: log.gameStats.rbis,
                strikeouts: log.gameStats.strikeouts,
                stolenBases: log.gameStats.stolenBases,
                errors: log.gameStats.errors,
              },
              log.gameStats.opponent,
            )
          : null,
      line:
        log.type === "GAME" && log.gameStats
          ? formatGameLine({
              atBats: log.gameStats.atBats,
              hits: log.gameStats.hits,
              doubles: log.gameStats.doubles,
              triples: log.gameStats.triples,
              homeRuns: log.gameStats.homeRuns,
              walks: log.gameStats.walks,
              hitByPitch: log.gameStats.hitByPitch,
              runs: log.gameStats.runs,
              rbis: log.gameStats.rbis,
              strikeouts: log.gameStats.strikeouts,
              stolenBases: log.gameStats.stolenBases,
              errors: log.gameStats.errors,
            })
          : null,
    })),
    seasonStats,
    canLogDay:
      getAllowedCompletionProgramDays({ startDate: params.enrollment.startDate }, now).has(
        viewedDayInfo.programDay,
      ) && !todayInfo.isBeforeStart && !todayInfo.isComplete,
    knownFor: params.enrollment.knownFor,
    startDate: params.enrollment.startDate
      ? formatProgramStartDateKey(params.enrollment.startDate)
      : null,
    viewedWeekdayName:
      params.enrollment.startDate && viewedDayInfo.programDay > 0
        ? getWeekdayNameForProgramDay(
            params.enrollment.startDate,
            viewedDayInfo.programDay,
          )
        : "",
    isBeforeStart: todayInfo.isBeforeStart,
    isComplete: todayInfo.isComplete,
    isRestDay: viewedDayInfo.dayOfWeek === 7,
    canCompleteTasks,
    isViewingYesterday:
      yesterdayInfo.programDay > 0 &&
      viewedDayInfo.programDay === yesterdayInfo.programDay &&
      viewedDayInfo.programDay !== todayInfo.programDay,
    isViewingPastDay:
      viewedDayInfo.programDay < todayInfo.programDay &&
      viewedDayInfo.programDay !== yesterdayInfo.programDay,
  };
}

export function assertTaskExistsForDay(
  enrollmentPlan: ProgramEnrollmentPlanInput,
  programDayInfo: ProgramDayInfo,
  taskKey: string,
  overrides?: Parameters<typeof findDailyTask>[3],
) {
  return findDailyTask(enrollmentPlan, programDayInfo, taskKey, overrides);
}
