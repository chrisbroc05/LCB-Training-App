import "server-only";

import {
  findDailyTask,
  getDailyPlan,
  type ProgramEnrollmentPlanInput,
} from "@/lib/program-daily-plan";
import {
  buildOverridesForWeekAndDay,
  type EnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import { validateDayLogNote } from "@/lib/program-stats";
import type { ProgramDayInfo } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

export function getHittingFieldingTasks(
  planInput: ProgramEnrollmentPlanInput,
  dayInfo: ProgramDayInfo,
  overrideBundle: EnrollmentPlanOverrideBundle,
) {
  if (dayInfo.programDay <= 0 || dayInfo.dayOfWeek === 7) {
    return [];
  }

  const overrides = buildOverridesForWeekAndDay(
    overrideBundle,
    dayInfo.weekNumber,
    dayInfo.programDay,
  );
  return getDailyPlan(planInput, dayInfo, overrides).filter(
    (task) => task.type === "hitting" || task.type === "fielding",
  );
}

export async function autoCompleteHittingFieldingFromLog(params: {
  enrollmentId: string;
  programDay: number;
  dayLogId: string;
  logType: "GAME" | "PRACTICE";
  note: string;
  planInput: ProgramEnrollmentPlanInput;
  dayInfo: ProgramDayInfo;
  overrideBundle: EnrollmentPlanOverrideBundle;
}) {
  const tasks = getHittingFieldingTasks(
    params.planInput,
    params.dayInfo,
    params.overrideBundle,
  );
  const prefix = params.logType === "GAME" ? "Game" : "Practice";
  const completionNote = `${prefix}: ${params.note}`;

  const existingCompletions = await prisma.taskCompletion.findMany({
    where: {
      enrollmentId: params.enrollmentId,
      programDay: params.programDay,
      taskKey: { in: tasks.map((task) => task.key) },
    },
    select: { taskKey: true },
  });
  const existingKeys = new Set(existingCompletions.map((item) => item.taskKey));

  const toCreate = tasks.filter((task) => !existingKeys.has(task.key));
  if (toCreate.length === 0) {
    return;
  }

  await prisma.taskCompletion.createMany({
    data: toCreate.map((task) => ({
      enrollmentId: params.enrollmentId,
      programDay: params.programDay,
      taskKey: task.key,
      taskType: task.type,
      note: completionNote,
      sourceDayLogId: params.dayLogId,
    })),
  });
}

export async function refreshAutoCompletionsForLog(params: {
  dayLogId: string;
  logType: "GAME" | "PRACTICE";
  note: string;
}) {
  const validated = validateDayLogNote(params.note);
  if (!validated.ok) {
    return;
  }

  const prefix = params.logType === "GAME" ? "Game" : "Practice";
  const completionNote = `${prefix}: ${validated.note}`;

  await prisma.taskCompletion.updateMany({
    where: { sourceDayLogId: params.dayLogId },
    data: { note: completionNote },
  });
}

export async function deleteAutoCompletionsForLog(dayLogId: string) {
  await prisma.taskCompletion.deleteMany({
    where: { sourceDayLogId: dayLogId },
  });
}

export function serializeDayLog(log: {
  id: string;
  programDay: number;
  type: "GAME" | "PRACTICE";
  note: string;
  createdAt: Date;
  gameStats: {
    opponent: string | null;
    atBats: number;
    hits: number;
    doubles: number;
    triples: number;
    homeRuns: number;
    walks: number;
    hitByPitch: number;
    runs: number;
    rbis: number;
    strikeouts: number;
    stolenBases: number;
    errors: number;
  } | null;
}) {
  return {
    id: log.id,
    programDay: log.programDay,
    type: log.type,
    note: log.note,
    createdAt: log.createdAt.toISOString(),
    gameStats: log.gameStats
      ? {
          opponent: log.gameStats.opponent,
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
        }
      : null,
  };
}

export async function loadEnrollmentGameStats(enrollmentId: string) {
  const logs = await prisma.dayLog.findMany({
    where: { enrollmentId, type: "GAME" },
    include: { gameStats: true },
    orderBy: [{ programDay: "desc" }, { createdAt: "desc" }],
  });

  return logs
    .filter((log) => log.gameStats)
    .map((log) => ({
      id: log.id,
      programDay: log.programDay,
      note: log.note,
      createdAt: log.createdAt.toISOString(),
      opponent: log.gameStats!.opponent,
      stats: {
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
      },
    }));
}

export function findTaskForCompletion(
  planInput: ProgramEnrollmentPlanInput,
  dayInfo: ProgramDayInfo,
  taskKey: string,
  overrideBundle: EnrollmentPlanOverrideBundle,
) {
  const overrides = buildOverridesForWeekAndDay(
    overrideBundle,
    dayInfo.weekNumber,
    dayInfo.programDay,
  );
  return findDailyTask(planInput, dayInfo, taskKey, overrides);
}
