import "server-only";

import type { ProgramEmailType, ProgramEnrollment } from "@prisma/client";
import { findDailyTask, getDailyPlan, getTaskKeysForDay } from "@/lib/program-daily-plan";
import { isGoneQuiet } from "@/lib/program-gone-quiet";
import {
  getChicagoDayEnd,
  getChicagoDayStart,
  getChicagoTomorrowDateKeyFromDateKey,
} from "@/lib/program-email-chicago";
import { getPlayerFirstName } from "@/lib/program-email-templates";
import { buildParentUnsubscribeUrl } from "@/lib/program-parent-token";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import { PROGRAM_PHASE_LABELS } from "@/lib/program-content";
import { formatGameLine } from "@/lib/program-stats";
import { computeProgramStreak, getDayOfWeekForProgramDay } from "@/lib/program-streak-shared";
import {
  formatProgramStartDateKey,
  getDateForProgramDay,
  getProgramDay,
  type ProgramDayInfo,
} from "@/lib/program-schedule";
import {
  buildProgramDayInfoForProgramDay,
  hasWeeklyVideoSent,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import { prisma } from "@/lib/prisma";

export type ActiveEnrollmentRecord = ProgramEnrollment & {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  taskCompletions: Array<{
    programDay: number;
    taskKey: string;
    note: string;
    completedAt: Date;
  }>;
};

export async function loadActiveEnrollments(now = new Date()) {
  return prisma.programEnrollment.findMany({
    where: {
      status: "ACTIVE",
      onboardingCompletedAt: { not: null },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      taskCompletions: {
        select: {
          programDay: true,
          taskKey: true,
          note: true,
          completedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

function getCompletedWorkDays(
  enrollment: ActiveEnrollmentRecord,
  planInput: NonNullable<ReturnType<typeof toEnrollmentPlanInput>>,
  maxProgramDay: number,
  overrideBundle: Awaited<ReturnType<typeof loadEnrollmentPlanOverrideBundle>>,
) {
  const completedWorkDays = new Set<number>();

  if (!enrollment.startDate) {
    return completedWorkDays;
  }

  for (let day = 1; day <= maxProgramDay; day += 1) {
    if (getDayOfWeekForProgramDay(day) === 7) {
      continue;
    }

    const dayInfo = buildProgramDayInfoForProgramDay({ startDate: enrollment.startDate }, day);
    const overrides = buildOverridesForWeekAndDay(overrideBundle, dayInfo.weekNumber, day);
    const expectedKeys = getTaskKeysForDay(planInput, dayInfo, overrides);
    if (expectedKeys.length === 0) {
      continue;
    }

    const doneCount = expectedKeys.filter((key) =>
      enrollment.taskCompletions.some((item) => item.programDay === day && item.taskKey === key),
    ).length;

    if (doneCount === expectedKeys.length) {
      completedWorkDays.add(day);
    }
  }

  return completedWorkDays;
}

export async function getEnrollmentTasksForProgramDay(
  enrollment: ActiveEnrollmentRecord,
  programDay: number,
) {
  const planInput = toEnrollmentPlanInput(enrollment);
  if (!planInput || !enrollment.startDate || programDay <= 0) {
    return [];
  }

  const dayInfo = buildProgramDayInfoForProgramDay({ startDate: enrollment.startDate }, programDay);
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);
  const overrides = buildOverridesForWeekAndDay(overrideBundle, dayInfo.weekNumber, programDay);
  return getDailyPlan(planInput, dayInfo, overrides);
}

export async function getEnrollmentCoachWeekBox(
  enrollment: ActiveEnrollmentRecord,
  dayInfo: ProgramDayInfo,
) {
  if (dayInfo.dayOfWeek !== 1) {
    return null;
  }

  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);
  const weekOverride = overrideBundle.weekOverrides.get(dayInfo.weekNumber);
  if (!weekOverride?.note?.trim()) {
    return null;
  }

  return {
    focus: weekOverride.cueLabel,
    note: weekOverride.note.trim(),
  };
}

export async function shouldSendGoneQuietEmail(params: {
  enrollmentId: string;
  type: Extract<ProgramEmailType, "GONE_QUIET" | "PARENT_GONE_QUIET">;
}) {
  const lastGoneQuiet = await prisma.emailLog.findFirst({
    where: {
      enrollmentId: params.enrollmentId,
      type: params.type,
    },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });

  if (!lastGoneQuiet) {
    return true;
  }

  const lastCompletion = await prisma.taskCompletion.findFirst({
    where: { enrollmentId: params.enrollmentId },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  if (!lastCompletion) {
    return false;
  }

  return lastCompletion.completedAt > lastGoneQuiet.sentAt;
}

function getProgramDaysForWeek(weekNumber: number) {
  const start = (weekNumber - 1) * 7 + 1;
  const end = weekNumber * 7;
  const days: number[] = [];
  for (let day = start; day <= end; day += 1) {
    if (getDayOfWeekForProgramDay(day) !== 7) {
      days.push(day);
    }
  }
  return days;
}

async function hasWeeklyVideoSentForProgramWeek(userId: string, weekNumber: number, startDate: Date) {
  const weekStartDay = (weekNumber - 1) * 7 + 1;
  const weekEndDay = weekNumber * 7;
  const rangeStart = getDateForProgramDay(startDate, weekStartDay);
  const rangeEnd = getDateForProgramDay(startDate, weekEndDay);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

  const [swingCount, mentalCount] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: {
        userId,
        createdAt: { gte: rangeStart, lt: rangeEnd },
      },
    }),
    prisma.mentalGameSubmission.count({
      where: {
        userId,
        createdAt: { gte: rangeStart, lt: rangeEnd },
      },
    }),
  ]);

  return swingCount + mentalCount > 0;
}

export async function buildWeeklyRecapData(
  enrollment: ActiveEnrollmentRecord,
  recapWeekNumber: number,
) {
  const planInput = toEnrollmentPlanInput(enrollment);
  if (!planInput || !enrollment.startDate || recapWeekNumber < 1 || recapWeekNumber > 12) {
    return null;
  }

  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);
  const weekDays = getProgramDaysForWeek(recapWeekNumber);
  let tasksCompleted = 0;
  let tasksTotal = 0;
  let daysFullyDone = 0;
  const weekNotes: string[] = [];

  for (const programDay of weekDays) {
    const dayInfo = buildProgramDayInfoForProgramDay({ startDate: enrollment.startDate }, programDay);
    const overrides = buildOverridesForWeekAndDay(overrideBundle, dayInfo.weekNumber, programDay);
    const expectedKeys = getTaskKeysForDay(planInput, dayInfo, overrides);
    tasksTotal += expectedKeys.length;

    let dayDone = expectedKeys.length > 0;
    for (const key of expectedKeys) {
      const completion = enrollment.taskCompletions.find(
        (item) => item.programDay === programDay && item.taskKey === key,
      );
      if (completion) {
        tasksCompleted += 1;
        if (completion.note.trim()) {
          weekNotes.push(completion.note.trim());
        }
      } else {
        dayDone = false;
      }
    }

    if (dayDone && expectedKeys.length > 0) {
      daysFullyDone += 1;
    }
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate });
  const completedWorkDays = getCompletedWorkDays(
    enrollment,
    planInput,
    Math.min(schedule.programDay, 84),
    overrideBundle,
  );
  const streak = computeProgramStreak({
    currentProgramDay: schedule.programDay,
    completedWorkDays,
  });

  const dayLogs = await prisma.dayLog.findMany({
    where: {
      enrollmentId: enrollment.id,
      programDay: { in: weekDays },
    },
    include: { gameStats: true },
    orderBy: [{ programDay: "asc" }, { createdAt: "asc" }],
  });

  const gamesAndPractices = dayLogs.map((log) => {
    if (log.type === "GAME" && log.gameStats) {
      const line = formatGameLine({
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
      });
      const opponent = log.gameStats.opponent?.trim();
      return opponent ? `Game vs ${opponent}: ${line}` : `Game: ${line}`;
    }

    return log.type === "PRACTICE" ? `Practice: ${log.note.trim()}` : log.note.trim();
  });

  const weekOverride = overrideBundle.weekOverrides.get(recapWeekNumber);
  const weeklyVideoSent = await hasWeeklyVideoSentForProgramWeek(
    enrollment.userId,
    recapWeekNumber,
    enrollment.startDate,
  );

  const bestNotes = weekNotes
    .sort((left, right) => right.length - left.length)
    .slice(0, 3);

  const nextWeekNumber = Math.min(recapWeekNumber + 1, 12);
  const nextWeekPhase =
    nextWeekNumber >= 9
      ? PROGRAM_PHASE_LABELS.COMPETE
      : nextWeekNumber >= 5
        ? PROGRAM_PHASE_LABELS.BUILD
        : PROGRAM_PHASE_LABELS.FOUNDATION;

  return {
    playerFirstName: getPlayerFirstName(enrollment.user.name, enrollment.user.email),
    weekNumber: recapWeekNumber,
    tasksCompleted,
    tasksTotal,
    streak,
    daysFullyDone,
    gamesAndPractices,
    weekFocus: weekOverride?.cueLabel ?? null,
    weekFocusNote: weekOverride?.note ?? null,
    weeklyVideoSent,
    bestNotes,
    nextWeekPhase,
    unsubscribeUrl: buildParentUnsubscribeUrl(enrollment.id),
  };
}

export async function buildCoachDailySummaryData(dateKey: string, now = new Date()) {
  const enrollments = await loadActiveEnrollments(now);
  if (enrollments.length === 0) {
    return null;
  }

  const dayStart = getChicagoDayStart(dateKey);
  const dayEnd = getChicagoDayEnd(dateKey);

  const finishedNames: string[] = [];
  const notFinished: Array<{ name: string; done: number; total: number }> = [];
  const goneQuietNames: string[] = [];

  for (const enrollment of enrollments) {
    const name = enrollment.user.name ?? enrollment.user.email;
    const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
    const planInput = toEnrollmentPlanInput(enrollment);

    const completionDays = new Set<number>();
    for (const completion of enrollment.taskCompletions) {
      completionDays.add(completion.programDay);
    }

    if (isGoneQuiet(schedule.programDay, completionDays)) {
      goneQuietNames.push(name);
    }

    if (!planInput || schedule.programDay <= 0 || schedule.dayOfWeek === 7 || schedule.isComplete) {
      continue;
    }

    const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);
    const dayInfo = buildProgramDayInfoForProgramDay(
      { startDate: enrollment.startDate },
      schedule.programDay,
    );
    const overrides = buildOverridesForWeekAndDay(
      overrideBundle,
      dayInfo.weekNumber,
      schedule.programDay,
    );
    const keys = getTaskKeysForDay(planInput, dayInfo, overrides);
    const done = keys.filter((key) =>
      enrollment.taskCompletions.some(
        (completion) =>
          completion.programDay === schedule.programDay && completion.taskKey === key,
      ),
    ).length;

    if (keys.length === 0) {
      continue;
    }

    if (done === keys.length) {
      finishedNames.push(name);
    } else {
      notFinished.push({ name, done, total: keys.length });
    }
  }

  const notesToday = await prisma.taskCompletion.findMany({
    where: {
      completedAt: { gte: dayStart, lt: dayEnd },
      enrollment: {
        status: "ACTIVE",
        onboardingCompletedAt: { not: null },
      },
    },
    include: {
      enrollment: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const recentNotes = await Promise.all(
    notesToday.slice(0, 5).map(async (completion) => {
      const planInput = toEnrollmentPlanInput(completion.enrollment);
      let taskTitle = completion.taskKey;
      if (planInput && completion.enrollment.startDate) {
        const dayInfo = buildProgramDayInfoForProgramDay(
          { startDate: completion.enrollment.startDate },
          completion.programDay,
        );
        const overrideBundle = await loadEnrollmentPlanOverrideBundle(completion.enrollmentId);
        const overrides = buildOverridesForWeekAndDay(
          overrideBundle,
          dayInfo.weekNumber,
          completion.programDay,
        );
        const task = findDailyTask(planInput, dayInfo, completion.taskKey, overrides);
        if (task) {
          taskTitle = task.title;
        }
      }

      return {
        playerName:
          completion.enrollment.user.name ?? completion.enrollment.user.email,
        taskTitle,
        note: completion.note.trim(),
      };
    }),
  );

  const gamesLoggedToday = await prisma.dayLog.findMany({
    where: {
      type: "GAME",
      createdAt: { gte: dayStart, lt: dayEnd },
      enrollment: {
        status: "ACTIVE",
        onboardingCompletedAt: { not: null },
      },
    },
    include: {
      enrollment: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      gameStats: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const gamesLogged = gamesLoggedToday
    .filter((log) => log.gameStats)
    .map((log) => ({
      name: log.enrollment.user.name ?? log.enrollment.user.email,
      line: formatGameLine({
        atBats: log.gameStats!.atBats,
        hits: log.gameStats!.hits,
        doubles: log.gameStats!.doubles,
        triples: log.gameStats!.triples,
        homeRuns: log.gameStats!.homeRuns,
        walks: log.gameStats!.walks,
        hitByPitch: log.gameStats!.hitByPitch,
        runs: log.gameStats!.runs,
        rbis: log.gameStats!.rbis,
        strikeouts: log.gameStats!.strikeouts,
        stolenBases: log.gameStats!.stolenBases,
        errors: log.gameStats!.errors,
      }),
    }));

  const [swingWaiting, mentalWaiting] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: { status: { in: ["PENDING", "REVIEWING"] } },
    }),
    prisma.mentalGameSubmission.count({
      where: { status: { in: ["PENDING", "REVIEWING"] } },
    }),
  ]);

  const workDayCount = enrollments.filter((enrollment) => {
    const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
    return schedule.programDay > 0 && schedule.dayOfWeek !== 7 && !schedule.isComplete;
  }).length;

  return {
    finished: finishedNames.length,
    active: workDayCount,
    finishedNames,
    notFinished,
    goneQuietNames,
    newNotesCount: notesToday.length,
    recentNotes,
    gamesLoggedToday: gamesLogged,
    videosWaiting: swingWaiting + mentalWaiting,
  };
}

export function isDayBeforeStart(enrollment: ActiveEnrollmentRecord, dateKey: string) {
  if (!enrollment.startDate) {
    return false;
  }

  const startKey = formatProgramStartDateKey(enrollment.startDate);
  const tomorrowFromToday = getChicagoTomorrowDateKeyFromDateKey(dateKey);
  return tomorrowFromToday === startKey;
}

export async function enrollmentNeedsVideoReminder(enrollment: ActiveEnrollmentRecord, now = new Date()) {
  return !(await hasWeeklyVideoSent(enrollment.userId, now));
}

export function getRecapWeekNumber(schedule: ProgramDayInfo) {
  if (schedule.programDay <= 0) {
    return null;
  }

  if (schedule.dayOfWeek === 7) {
    return schedule.weekNumber;
  }

  return schedule.weekNumber - 1;
}
