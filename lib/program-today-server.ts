import "server-only";

import { formatReflectionNote, parseReflectionNote } from "@/lib/program-content";
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
  getWeekdayLabelForProgramDay,
  getWeekdayNameForProgramDay,
  parseProgramDateKey,
  type ProgramDayInfo,
} from "@/lib/program-schedule";
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
};

export type ProgramWeekDayStatus = {
  programDay: number;
  dayOfWeek: number;
  weekdayLabel: string;
  weekdayName: string;
  status: "complete" | "partial" | "missed" | "upcoming" | "rest";
  isToday: boolean;
  tappable: boolean;
  editable: boolean;
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
  if (trimmed.length < 3 || trimmed.length > 400) {
    return { ok: false as const, error: "Notes must be between 3 and 400 characters." };
  }

  if (task.type === "reflection") {
    const parsed = parseReflectionNote(trimmed);
    if (!parsed.bestRep || !parsed.stillHard || !parsed.knownForNext) {
      return { ok: false as const, error: "All three reflection answers are required." };
    }

    return {
      ok: true as const,
      note: formatReflectionNote(parsed),
    };
  }

  return { ok: true as const, note: trimmed };
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
      ? buildProgramDayInfoForProgramDay({ startDate: params.enrollment.startDate }, 1)
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
    },
  });

  const completionMap = new Map<string, ProgramTaskCompletionRecord>();
  for (const completion of completions) {
    completionMap.set(`${completion.programDay}:${completion.taskKey}`, {
      taskKey: completion.taskKey,
      note: completion.note,
      completedAt: completion.completedAt.toISOString(),
    });
  }

  const tasks: ProgramTodayTask[] = viewedTasks.map((task) => {
    const saved = completionMap.get(`${viewedDayInfo.programDay}:${task.key}`);
    return {
      ...task,
      completed: Boolean(saved),
      note: saved?.note,
      completedAt: saved?.completedAt,
    };
  });

  const completedWorkDays = new Set<number>();
  if (planInput && params.enrollment.startDate) {
    for (let day = 1; day <= Math.min(todayInfo.programDay, 84); day += 1) {
      if (getDayOfWeekForProgramDay(day) === 7) {
        continue;
      }

      const dayInfo = buildProgramDayInfoForProgramDay(
        { startDate: params.enrollment.startDate },
        day,
      );
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

  const weekStartProgramDay =
    viewedDayInfo.weekNumber > 0 ? (viewedDayInfo.weekNumber - 1) * 7 + 1 : 0;
  const weekDays: ProgramWeekDayStatus[] = [];

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayInfo = getProgramDay({ startDate: params.enrollment.startDate }, yesterday);
  const startDate = params.enrollment.startDate;

  for (let offset = 0; offset < 7; offset += 1) {
    const programDay = weekStartProgramDay + offset;
    const dayOfWeek = offset + 1;
    if (programDay > 84) {
      break;
    }

    const weekdayLabel =
      startDate && programDay > 0
        ? getWeekdayLabelForProgramDay(startDate, programDay)
        : "?";
    const weekdayName =
      startDate && programDay > 0
        ? getWeekdayNameForProgramDay(startDate, programDay)
        : "Day";
    const isToday = programDay === todayInfo.programDay;
    const tappable = programDay > 0 && programDay <= todayInfo.programDay;
    const editable =
      yesterdayInfo.programDay > 0 &&
      programDay === yesterdayInfo.programDay &&
      programDay !== todayInfo.programDay;

    if (dayOfWeek === 7) {
      weekDays.push({
        programDay,
        dayOfWeek,
        weekdayLabel,
        weekdayName,
        status: "rest",
        isToday,
        tappable,
        editable: false,
      });
      continue;
    }

    const dayInfo = buildProgramDayInfoForProgramDay(
      { startDate: params.enrollment.startDate },
      programDay,
    );
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
    });
  }

  const canCompleteTasks =
    viewedDayInfo.programDay === todayInfo.programDay ||
    (yesterdayInfo.programDay > 0 && viewedDayInfo.programDay === yesterdayInfo.programDay);

  const allTasksComplete =
    tasks.length > 0 && tasks.every((task) => task.completed) && viewedProgramDay === todayInfo.programDay;

  const weeklyVideoSent = await hasWeeklyVideoSent(params.userId, now);

  const weekFocusCue = viewedOverrides?.focusOverride?.cueLabel ?? null;
  const weekFocusNote = getWeekFocusNote(viewedOverrides);

  return {
    todayProgramDay: todayInfo.programDay,
    viewedProgramDay: viewedDayInfo.programDay,
    programDayInfo: viewedDayInfo,
    tasks,
    previewTasks,
    streak,
    weekDays,
    allTasksComplete,
    weeklyVideoSent,
    weekFocusCue,
    weekFocusNote,
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
