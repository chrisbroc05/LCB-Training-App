import "server-only";

import { getDailyPlan, findDailyTask } from "@/lib/program-daily-plan";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import {
  PROGRAM_AGE_GROUP_LABELS,
  PROGRAM_EQUIPMENT_LABELS,
  PROGRAM_FOCUS_AREA_LABELS,
  PROGRAM_SEASON_MODE_LABELS,
  type ProgramEquipmentOption,
  type ProgramFocusArea,
} from "@/lib/program-enrollment-shared";
import { HITTING_FOCUS_CUES } from "@/lib/program-content";
import { getProgramDay, getChicagoMondayStart } from "@/lib/program-schedule";
import { computeProgramStreak, getDayOfWeekForProgramDay } from "@/lib/program-streak-shared";
import {
  buildProgramDayInfoForProgramDay,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import {
  loadEnrollmentGameStats,
  serializeDayLog,
} from "@/lib/program-day-log-server";
import {
  aggregateGameStats,
  computeAvg,
  computeObp,
  computeSlg,
  formatGameLine,
  formatGameSummary,
  formatRate,
} from "@/lib/program-stats";
import { getWeekdayLabelForProgramDay } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";
import { formatRefundLabel } from "@/lib/stripe-refund-shared";

export async function buildAdminProgramPlayerDetail(enrollmentId: string, now = new Date()) {
  const enrollment = await prisma.programEnrollment.findUnique({
    where: { id: enrollmentId },
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
      weekFocusOverrides: {
        include: { cue: true },
      },
      customTasks: true,
    },
  });

  if (!enrollment) {
    return null;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const planInput = toEnrollmentPlanInput(enrollment);
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);

  const completedWorkDays = new Set<number>();
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
      const tasks = getDailyPlan(planInput, dayInfo, overrides);
      if (tasks.length === 0) {
        continue;
      }

      const allDone = tasks.every((task) =>
        enrollment.taskCompletions.some(
          (item) => item.programDay === day && item.taskKey === task.key,
        ),
      );

      if (allDone) {
        completedWorkDays.add(day);
      }
    }
  }

  const weekStart = getChicagoMondayStart(now);
  const [swingSubmissions, mentalSubmissions] = await Promise.all([
    prisma.swingAnalysisSubmission.findMany({
      where: {
        userId: enrollment.userId,
        createdAt: { gte: weekStart },
      },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentalGameSubmission.findMany({
      where: {
        userId: enrollment.userId,
        createdAt: { gte: weekStart },
      },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const currentWeekOverride = enrollment.weekFocusOverrides.find(
    (item) => item.weekNumber === schedule.weekNumber,
  );
  const nextWeekNumber =
    schedule.weekNumber > 0 && schedule.weekNumber < 12 ? schedule.weekNumber + 1 : null;
  const nextWeekOverride =
    nextWeekNumber != null
      ? enrollment.weekFocusOverrides.find((item) => item.weekNumber === nextWeekNumber)
      : null;
  const defaultCueLabel =
    HITTING_FOCUS_CUES[schedule.weekNumber] ?? HITTING_FOCUS_CUES[1];

  const [gameLogs, dayLogs] = await Promise.all([
    loadEnrollmentGameStats(enrollment.id),
    prisma.dayLog.findMany({
      where: { enrollmentId: enrollment.id },
      include: { gameStats: true },
      orderBy: [{ programDay: "desc" }, { createdAt: "desc" }],
    }),
  ]);
  const statTotals = aggregateGameStats(gameLogs.map((log) => log.stats));

  return {
    enrollment: {
      id: enrollment.id,
      userId: enrollment.userId,
      name: enrollment.user.name,
      email: enrollment.user.email,
      status: enrollment.status,
      refundedAt: enrollment.refundedAt?.toISOString() ?? null,
      refundAmountCents: enrollment.refundAmountCents,
      refundLabel:
        enrollment.refundedAt && enrollment.refundAmountCents != null
          ? formatRefundLabel(enrollment.refundedAt, enrollment.refundAmountCents)
          : null,
      startDate: enrollment.startDate?.toISOString().slice(0, 10) ?? null,
      ageGroup: enrollment.ageGroup,
      ageGroupLabel: enrollment.ageGroup
        ? PROGRAM_AGE_GROUP_LABELS[enrollment.ageGroup]
        : null,
      position: enrollment.position,
      focusAreas: enrollment.focusAreas,
      focusAreaLabels: enrollment.focusAreas.map(
        (area) => PROGRAM_FOCUS_AREA_LABELS[area as ProgramFocusArea] ?? area,
      ),
      equipment: enrollment.equipment,
      equipmentLabels: enrollment.equipment.map(
        (item) => PROGRAM_EQUIPMENT_LABELS[item as ProgramEquipmentOption] ?? item,
      ),
      seasonMode: enrollment.seasonMode,
      seasonModeLabel: enrollment.seasonMode
        ? PROGRAM_SEASON_MODE_LABELS[enrollment.seasonMode]
        : null,
      knownFor: enrollment.knownFor,
      parentName: enrollment.parentName,
      parentEmail: enrollment.parentEmail,
      parentEmailsEnabled: enrollment.parentEmailsEnabled,
      dailyRoutineEmailsEnabled: enrollment.dailyRoutineEmailsEnabled,
    },
    schedule,
    streak: computeProgramStreak({
      currentProgramDay: schedule.programDay,
      completedWorkDays,
    }),
    focus: {
      weekNumber: schedule.weekNumber,
      defaultCueLabel,
      override: currentWeekOverride
        ? {
            id: currentWeekOverride.id,
            cueId: currentWeekOverride.cueId,
            cueLabel: currentWeekOverride.cue.label,
            note: currentWeekOverride.note,
          }
        : null,
      nextWeekOverride: nextWeekOverride
        ? {
            weekNumber: nextWeekNumber!,
            id: nextWeekOverride.id,
            cueId: nextWeekOverride.cueId,
            cueLabel: nextWeekOverride.cue.label,
            note: nextWeekOverride.note,
          }
        : null,
    },
    weekSubmissions: [
      ...swingSubmissions.map((item) => ({
        type: "swing" as const,
        id: item.id,
        href: `/admin?submission=swing&id=${item.id}`,
        createdAt: item.createdAt.toISOString(),
      })),
      ...mentalSubmissions.map((item) => ({
        type: "mental" as const,
        id: item.id,
        href: `/admin?submission=mental&id=${item.id}`,
        createdAt: item.createdAt.toISOString(),
      })),
    ],
    customTasks: enrollment.customTasks.map((task) => ({
      id: task.id,
      programDay: task.programDay,
      title: task.title,
      target: task.target,
      details: task.details,
      drillIds: task.drillIds,
      replacesTaskKey: task.replacesTaskKey,
    })),
    weekFocusOverrides: enrollment.weekFocusOverrides.map((item) => ({
      id: item.id,
      weekNumber: item.weekNumber,
      cueId: item.cueId,
      cueLabel: item.cue.label,
      note: item.note,
    })),
    completions: enrollment.taskCompletions.map((item) => ({
      programDay: item.programDay,
      taskKey: item.taskKey,
      note: item.note,
      completedAt: item.completedAt.toISOString(),
    })),
    dayLogs: dayLogs.map((log) => serializeDayLog(log)),
    stats: {
      totals: {
        games: statTotals.games,
        atBats: statTotals.atBats,
        hits: statTotals.hits,
        doubles: statTotals.doubles,
        triples: statTotals.triples,
        homeRuns: statTotals.homeRuns,
        walks: statTotals.walks,
        hitByPitch: statTotals.hitByPitch,
        runs: statTotals.runs,
        rbis: statTotals.rbis,
        strikeouts: statTotals.strikeouts,
        stolenBases: statTotals.stolenBases,
        errors: statTotals.errors,
        avg: formatRate(computeAvg(statTotals)),
        obp: formatRate(computeObp(statTotals)),
        slg: formatRate(computeSlg(statTotals)),
      },
      gameLogs: gameLogs.map((log) => ({
        id: log.id,
        programDay: log.programDay,
        note: log.note,
        opponent: log.opponent,
        line: formatGameLine(log.stats),
        summary: formatGameSummary(log.stats, log.opponent),
        weekdayLabel:
          enrollment.startDate && log.programDay > 0
            ? getWeekdayLabelForProgramDay(enrollment.startDate, log.programDay)
            : "?",
      })),
    },
    planInput,
    overrideBundleLoaded: true,
  };
}

export function buildAdminWeekDayTasks(params: {
  enrollment: {
    startDate: Date | null;
    taskCompletions: Array<{
      programDay: number;
      taskKey: string;
      note: string;
      completedAt: Date;
    }>;
  };
  planInput: NonNullable<ReturnType<typeof toEnrollmentPlanInput>>;
  weekNumber: number;
  overrideBundle: Awaited<ReturnType<typeof loadEnrollmentPlanOverrideBundle>>;
}) {
  const days = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const programDay = (params.weekNumber - 1) * 7 + offset + 1;
    if (programDay > 84) {
      break;
    }

    const dayInfo = buildProgramDayInfoForProgramDay(
      { startDate: params.enrollment.startDate },
      programDay,
    );
    const overrides = buildOverridesForWeekAndDay(
      params.overrideBundle,
      params.weekNumber,
      programDay,
    );
    const tasks =
      dayInfo.dayOfWeek === 7
        ? []
        : getDailyPlan(params.planInput, dayInfo, overrides).map((task) => {
            const completion = params.enrollment.taskCompletions.find(
              (item) => item.programDay === programDay && item.taskKey === task.key,
            );

            return {
              ...task,
              completed: Boolean(completion),
              note: completion?.note ?? null,
              completedAt: completion?.completedAt.toISOString() ?? null,
            };
          });

    days.push({
      programDay,
      dayOfWeek: dayInfo.dayOfWeek,
      isRestDay: dayInfo.dayOfWeek === 7,
      tasks,
    });
  }

  return days;
}

export function resolveTaskTitle(
  planInput: NonNullable<ReturnType<typeof toEnrollmentPlanInput>>,
  enrollment: { startDate: Date | null },
  overrideBundle: Awaited<ReturnType<typeof loadEnrollmentPlanOverrideBundle>>,
  programDay: number,
  taskKey: string,
) {
  const dayInfo = buildProgramDayInfoForProgramDay(
    { startDate: enrollment.startDate },
    programDay,
  );
  const overrides = buildOverridesForWeekAndDay(
    overrideBundle,
    dayInfo.weekNumber,
    programDay,
  );
  return findDailyTask(planInput, dayInfo, taskKey, overrides)?.title ?? taskKey;
}
