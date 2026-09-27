import {
  allDrillLibraryVideos,
  getDrillLibraryVideoId,
} from "@/lib/drill-library-videos";
import type { ProgramDrillRef } from "@/lib/program-drill-tags";
import type { ProgramDailyTask } from "@/lib/program-daily-plan";

export type ProgramFocusOverrideInput = {
  cueLabel: string;
  drillIds: string[];
  note?: string | null;
};

export type ProgramCustomTaskInput = {
  id: string;
  programDay: number;
  title: string;
  target: string;
  details?: string | null;
  drillIds: string[];
  replacesTaskKey?: string | null;
};

export type ProgramDailyPlanOverrides = {
  focusOverride?: ProgramFocusOverrideInput | null;
  customTasks?: ProgramCustomTaskInput[];
};

const drillByVimeoId = new Map<string, ProgramDrillRef>();

for (const video of allDrillLibraryVideos) {
  const vimeoId = getDrillLibraryVideoId(video);
  if (!vimeoId) {
    continue;
  }

  drillByVimeoId.set(vimeoId, {
    title: video.title,
    vimeoId,
    href: `/drill-library?drill=${vimeoId}`,
  });
}

export function resolveDrillsFromVimeoIds(drillIds: string[], maxCount = 3): ProgramDrillRef[] {
  const resolved: ProgramDrillRef[] = [];

  for (const drillId of drillIds) {
    const drill = drillByVimeoId.get(drillId);
    if (drill) {
      resolved.push(drill);
    }

    if (resolved.length >= maxCount) {
      break;
    }
  }

  return resolved;
}

export function buildCustomTaskKey(programDay: number, customTaskId: string) {
  return `d${programDay}-custom-${customTaskId}`;
}

export function applyDailyPlanOverrides(
  tasks: ProgramDailyTask[],
  programDay: number,
  overrides?: ProgramDailyPlanOverrides,
): ProgramDailyTask[] {
  if (!overrides) {
    return tasks;
  }

  let working = [...tasks];

  if (overrides.focusOverride) {
    const { cueLabel, drillIds } = overrides.focusOverride;
    const drills = resolveDrillsFromVimeoIds(drillIds, 3);
    working = working.map((task) => {
      if (task.type !== "hitting") {
        return task;
      }

      return {
        ...task,
        focus: `Focus: ${cueLabel}`,
        drills,
      };
    });
  }

  const dayCustomTasks = (overrides.customTasks ?? []).filter(
    (task) => task.programDay === programDay,
  );

  for (const customTask of dayCustomTasks) {
    if (customTask.replacesTaskKey) {
      working = working.filter((task) => task.key !== customTask.replacesTaskKey);
    }

    working.push({
      key: buildCustomTaskKey(programDay, customTask.id),
      type: "custom",
      title: customTask.title,
      target: customTask.target,
      targetDetail: customTask.details ?? undefined,
      drills: resolveDrillsFromVimeoIds(customTask.drillIds, 3),
      needsNote: true,
      isCoachAdded: true,
    });
  }

  return working;
}

export function getWeekFocusNote(overrides?: ProgramDailyPlanOverrides) {
  return overrides?.focusOverride?.note?.trim() || null;
}
