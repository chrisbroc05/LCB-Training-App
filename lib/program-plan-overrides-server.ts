import "server-only";

import type { ProgramDailyPlanOverrides, ProgramCustomTaskInput } from "@/lib/program-plan-overrides";
import type { ProgramActiveTrackInput } from "@/lib/program-track-plan";
import type { ProgramTrackKey } from "@/lib/program-tracks";
import { getChicagoTodayDateKey, getProgramDayNumberForDate } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

export type EnrollmentPlanOverrideBundle = {
  weekOverrides: Map<number, { cueLabel: string; drillIds: string[]; note: string }>;
  customTasks: ProgramCustomTaskInput[];
  activeTracks: ProgramActiveTrackInput[];
};

export async function loadEnrollmentPlanOverrideBundle(
  enrollmentId: string,
  enrollmentStartDate: Date | null = null,
): Promise<EnrollmentPlanOverrideBundle> {
  const [weekOverrides, customTasks, enrollmentTracks, enrollment] = await Promise.all([
    prisma.weekFocusOverride.findMany({
      where: { enrollmentId },
      include: { cue: true },
    }),
    prisma.customTask.findMany({
      where: { enrollmentId },
      orderBy: [{ programDay: "asc" }, { createdAt: "asc" }],
    }),
    prisma.enrollmentTrack.findMany({
      where: { enrollmentId, active: true },
    }),
    enrollmentStartDate === null
      ? prisma.programEnrollment.findUnique({
          where: { id: enrollmentId },
          select: { startDate: true },
        })
      : Promise.resolve(null),
  ]);

  const startDate = enrollmentStartDate ?? enrollment?.startDate ?? null;

  const weekOverrideMap = new Map<number, { cueLabel: string; drillIds: string[]; note: string }>();
  for (const override of weekOverrides) {
    weekOverrideMap.set(override.weekNumber, {
      cueLabel: override.cue.label,
      drillIds: override.cue.drillIds,
      note: override.note,
    });
  }

  const activeTracks: ProgramActiveTrackInput[] = [];
  for (const track of enrollmentTracks) {
    if (!startDate) {
      continue;
    }
    const startedProgramDay = getProgramDayNumberForDate(
      startDate,
      getChicagoTodayDateKey(track.startedAt),
    );
    if (startedProgramDay <= 0) {
      continue;
    }
    activeTracks.push({
      trackKey: track.trackKey as ProgramTrackKey,
      startedProgramDay,
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
    activeTracks,
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
    activeTracks: bundle.activeTracks,
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
    activeTracks: bundle.activeTracks,
  };
}
