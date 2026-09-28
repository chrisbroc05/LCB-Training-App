import "server-only";

import { findDailyTask, getTaskKeysForDay } from "@/lib/program-daily-plan";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import { isGoneQuiet } from "@/lib/program-gone-quiet";
import { computeProgramStreak, getDayOfWeekForProgramDay } from "@/lib/program-streak-shared";
import { getProgramDay } from "@/lib/program-schedule";
import {
  buildProgramDayInfoForProgramDay,
  hasWeeklyVideoSent,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import { formatRelativeTime } from "@/lib/format-date";
import { formatGameLine } from "@/lib/program-stats";
import { getWeekdayLabelForProgramDay } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

export async function buildAdminProgramOverview(now = new Date()) {
  const enrollments = await prisma.programEnrollment.findMany({
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
        for (let day = 1; day <= Math.min(schedule.programDay, 84); day += 1) {
          if (getDayOfWeekForProgramDay(day) === 7) {
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

      const weeklyVideoSent = await hasWeeklyVideoSent(enrollment.userId, now);
      const goneQuiet = isGoneQuiet(schedule.programDay, completionDays);
      const finishedToday = todayTotal > 0 && todayDone === todayTotal;
      const streak = computeProgramStreak({
        currentProgramDay: schedule.programDay,
        completedWorkDays,
      });

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

      return {
        enrollmentId: enrollment.id,
        name: enrollment.user.name ?? enrollment.user.email,
        email: enrollment.user.email,
        weekNumber: schedule.weekNumber,
        programDay: schedule.programDay,
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

      return {
        enrollmentId: completion.enrollmentId,
        playerName: completion.enrollment.user.name ?? completion.enrollment.user.email,
        taskTitle,
        programDay: completion.programDay,
        note: completion.note,
        relativeTime: formatRelativeTime(completion.completedAt, now),
      };
    }),
  );

  return {
    players: players.map(({ sortBucket: _sortBucket, ...player }) => player),
    latestNotes,
  };
}
