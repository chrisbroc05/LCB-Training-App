import "server-only";

import { findDailyTask, getTaskKeysForDay } from "@/lib/program-daily-plan";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import { isGoneQuiet } from "@/lib/program-gone-quiet";
import { computeProgramStreak, getDayOfWeekForProgramDay } from "@/lib/program-streak-shared";
import {
  getChicagoDaysSinceDate,
  getProgramDay,
  PROGRAM_DAY_COUNT,
  getWeekdayLabelForProgramDay,
  getWeekdayNameForProgramDay,
} from "@/lib/program-schedule";
import {
  buildProgramDayInfoForProgramDay,
  hasWeeklyVideoSent,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import { hasSetupReminderBeenSent } from "@/lib/program-email-data";
import { formatRelativeTime } from "@/lib/format-date";
import { formatGameLine } from "@/lib/program-stats";
import { prisma } from "@/lib/prisma";

type OverviewOptions = {
  showTestAccounts?: boolean;
};

function buildTestAccountEnrollmentFilter(showTestAccounts: boolean) {
  return showTestAccounts ? {} : { user: { isTestAccount: false } };
}

export async function buildAdminProgramOverview(now = new Date(), options?: OverviewOptions) {
  const showTestAccounts = options?.showTestAccounts ?? false;
  const testAccountFilter = buildTestAccountEnrollmentFilter(showTestAccounts);

  const waitingEnrollments = await prisma.programEnrollment.findMany({
    where: {
      status: "ACTIVE",
      onboardingCompletedAt: null,
      ...testAccountFilter,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isTestAccount: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const waitingOnSetup = await Promise.all(
    waitingEnrollments.map(async (enrollment) => ({
      enrollmentId: enrollment.id,
      userId: enrollment.userId,
      name: enrollment.user.name ?? enrollment.user.email,
      email: enrollment.user.email,
      enrolledDate: enrollment.createdAt.toISOString().slice(0, 10),
      startDate: enrollment.startDate?.toISOString().slice(0, 10) ?? null,
      daysWaiting: getChicagoDaysSinceDate(enrollment.createdAt, now),
      reminderSent: await hasSetupReminderBeenSent(enrollment.id, enrollment.userId),
      isTestAccount: enrollment.user.isTestAccount,
    })),
  );

  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      status: "ACTIVE",
      onboardingCompletedAt: { not: null },
      ...testAccountFilter,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isTestAccount: true,
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

  const players = await Promise.all(
    enrollments.map(async (enrollment) => {
      const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
      const planInput = toEnrollmentPlanInput(enrollment);
      const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);

      const completionDays = new Set<number>();
      const completedWorkDays = new Set<number>();
      for (const completion of enrollment.taskCompletions) {
        completionDays.add(completion.programDay);
      }

      if (planInput && enrollment.startDate) {
        for (let day = 1; day <= Math.min(schedule.programDay, PROGRAM_DAY_COUNT); day += 1) {
          if (getDayOfWeekForProgramDay(enrollment.startDate, day) === 7) {
            continue;
          }

          const dayInfo = buildProgramDayInfoForProgramDay(
            { startDate: enrollment.startDate },
            day,
          );
          const overrides = buildOverridesForWeekAndDay(
            overrideBundle,
            dayInfo.weekNumber,
            day,
          );
          const expectedKeys = getTaskKeysForDay(planInput, dayInfo, overrides);
          if (expectedKeys.length === 0) {
            continue;
          }

          const doneCount = expectedKeys.filter((key) =>
            enrollment.taskCompletions.some(
              (item) => item.programDay === day && item.taskKey === key,
            ),
          ).length;

          if (doneCount === expectedKeys.length) {
            completedWorkDays.add(day);
          }
        }
      }

      let todayTotal = 0;
      let todayDone = 0;
      if (planInput && schedule.programDay > 0 && schedule.dayOfWeek !== 7) {
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
        todayTotal = keys.length;
        todayDone = keys.filter((key) =>
          enrollment.taskCompletions.some(
            (completion) =>
              completion.programDay === schedule.programDay && completion.taskKey === key,
          ),
        ).length;
      }

      const lastCompletion = enrollment.taskCompletions.reduce<Date | null>((latest, item) => {
        if (!latest || item.completedAt > latest) {
          return item.completedAt;
        }
        return latest;
      }, null);

      const weeklyVideoSent = await hasWeeklyVideoSent(
        enrollment.userId,
        enrollment.startDate,
        now,
      );
      const goneQuiet = Boolean(
        enrollment.startDate &&
          isGoneQuiet(enrollment.startDate, schedule.programDay, completionDays),
      );
      const finishedToday = todayTotal > 0 && todayDone === todayTotal;
      const streak = enrollment.startDate
        ? computeProgramStreak({
            startDate: enrollment.startDate,
            currentProgramDay: schedule.programDay,
            completedWorkDays,
          })
        : 0;

      const lastGameLog = await prisma.dayLog.findFirst({
        where: { enrollmentId: enrollment.id, type: "GAME" },
        include: { gameStats: true },
        orderBy: [{ programDay: "desc" }, { createdAt: "desc" }],
      });

      const pushCount = await prisma.pushSubscription.count({
        where: { userId: enrollment.userId },
      });

      let lastGameLabel: string | null = null;
      if (lastGameLog?.gameStats && enrollment.startDate) {
        const line = formatGameLine({
          atBats: lastGameLog.gameStats.atBats,
          hits: lastGameLog.gameStats.hits,
          doubles: lastGameLog.gameStats.doubles,
          triples: lastGameLog.gameStats.triples,
          homeRuns: lastGameLog.gameStats.homeRuns,
          walks: lastGameLog.gameStats.walks,
          hitByPitch: lastGameLog.gameStats.hitByPitch,
          runs: lastGameLog.gameStats.runs,
          rbis: lastGameLog.gameStats.rbis,
          strikeouts: lastGameLog.gameStats.strikeouts,
          stolenBases: lastGameLog.gameStats.stolenBases,
          errors: lastGameLog.gameStats.errors,
        });
        const weekday = getWeekdayLabelForProgramDay(
          enrollment.startDate,
          lastGameLog.programDay,
        );
        lastGameLabel = `Last game: ${line} (${weekday})`;
      }

      const weekdayName =
        enrollment.startDate && schedule.programDay > 0
          ? getWeekdayNameForProgramDay(enrollment.startDate, schedule.programDay)
          : "Day";

      return {
        enrollmentId: enrollment.id,
        name: enrollment.user.name ?? enrollment.user.email,
        email: enrollment.user.email,
        isTestAccount: enrollment.user.isTestAccount,
        weekNumber: schedule.weekNumber,
        programDay: schedule.programDay,
        weekdayName,
        phase: schedule.phase,
        todayDone,
        todayTotal,
        streak,
        lastCheckIn: formatRelativeTime(lastCompletion ?? null, now),
        weeklyVideoSent,
        seasonMode: enrollment.seasonMode,
        goneQuiet,
        finishedToday,
        lastGameLabel,
        hasPush: pushCount > 0,
        sortBucket: goneQuiet ? 0 : finishedToday ? 2 : 1,
      };
    }),
  );

  players.sort((left, right) => {
    if (left.sortBucket !== right.sortBucket) {
      return left.sortBucket - right.sortBucket;
    }
    return left.name.localeCompare(right.name);
  });

  const latestCompletions = await prisma.taskCompletion.findMany({
    where: {
      enrollment: {
        status: "ACTIVE",
        onboardingCompletedAt: { not: null },
        ...testAccountFilter,
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
    take: 30,
  });

  const latestNotes = await Promise.all(
    latestCompletions.map(async (completion) => {
      const planInput = toEnrollmentPlanInput(completion.enrollment);
      const dayInfo = buildProgramDayInfoForProgramDay(
        { startDate: completion.enrollment.startDate },
        completion.programDay,
      );
      let taskTitle = completion.taskKey;

      if (planInput && dayInfo.programDay > 0) {
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

      const weekdayName =
        completion.enrollment.startDate && dayInfo.programDay > 0
          ? getWeekdayNameForProgramDay(
              completion.enrollment.startDate,
              completion.programDay,
            )
          : "Day";

      return {
        enrollmentId: completion.enrollmentId,
        playerName: completion.enrollment.user.name ?? completion.enrollment.user.email,
        taskTitle,
        programDay: completion.programDay,
        weekNumber: dayInfo.weekNumber,
        weekdayName,
        note: completion.note,
        relativeTime: formatRelativeTime(completion.completedAt, now),
      };
    }),
  );

  return {
    waitingOnSetup,
    players: players.map(({ sortBucket: _sortBucket, ...player }) => player),
    latestNotes,
    showTestAccounts,
    activePlayerCount: players.length,
    waitingOnSetupCount: waitingOnSetup.length,
  };
}
