import "server-only";

import type { ProgramDailyPlanOverrides, ProgramCustomTaskInput } from "@/lib/program-plan-overrides";
import { prisma } from "@/lib/prisma";

export type EnrollmentPlanOverrideBundle = {
  weekOverrides: Map<number, { cueLabel: string; drillIds: string[]; note: string }>;
  customTasks: ProgramCustomTaskInput[];
};

export async function loadEnrollmentPlanOverrideBundle(
  enrollmentId: string,
): Promise<EnrollmentPlanOverrideBundle> {
  const [weekOverrides, customTasks] = await Promise.all([
    prisma.weekFocusOverride.findMany({
      where: { enrollmentId },
      include: { cue: true },
    }),
    prisma.customTask.findMany({
      where: { enrollmentId },
      orderBy: [{ programDay: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const weekOverrideMap = new Map<number, { cueLabel: string; drillIds: string[]; note: string }>();
  for (const override of weekOverrides) {
    weekOverrideMap.set(override.weekNumber, {
      cueLabel: override.cue.label,
      drillIds: override.cue.drillIds,
      note: override.note,
    });
  }

  return {
    weekOverrides: weekOverrideMap,
    customTasks: customTasks.map((task) => ({
      id: task.id,
      programDay: task.programDay,
      title: task.title,
      target: task.target,
      details: task.details,
      drillIds: task.drillIds,
      replacesTaskKey: task.replacesTaskKey,
    })),
  };
}

export function buildOverridesForWeekAndDay(
  bundle: EnrollmentPlanOverrideBundle,
  weekNumber: number,
  programDay: number,
): ProgramDailyPlanOverrides {
  const weekOverride = bundle.weekOverrides.get(weekNumber);

  return {
    focusOverride: weekOverride
      ? {
          cueLabel: weekOverride.cueLabel,
          drillIds: weekOverride.drillIds,
          note: weekOverride.note,
        }
      : null,
    customTasks: bundle.customTasks.filter((task) => task.programDay === programDay),
  };
}

export function buildOverridesForWeek(
  bundle: EnrollmentPlanOverrideBundle,
  weekNumber: number,
): ProgramDailyPlanOverrides {
  const weekOverride = bundle.weekOverrides.get(weekNumber);

  return {
    focusOverride: weekOverride
      ? {
          cueLabel: weekOverride.cueLabel,
          drillIds: weekOverride.drillIds,
          note: weekOverride.note,
        }
      : null,
    customTasks: bundle.customTasks,
  };
}
