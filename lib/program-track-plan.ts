import type { ProgramDailyTask } from "@/lib/program-daily-plan";
import type { ProgramDayInfo } from "@/lib/program-schedule";
import { resolveDrillsFromVimeoIds } from "@/lib/program-plan-overrides";
import {
  buildTrackTaskKey,
  getProgramTrackDefinition,
  getTrackPhaseKey,
  type ProgramTrackExercise,
  type ProgramTrackKey,
} from "@/lib/program-tracks";

export type ProgramActiveTrackInput = {
  trackKey: ProgramTrackKey;
  /** First program day this track is active (inclusive). */
  startedProgramDay: number;
};

function formatExerciseTarget(exercises: ProgramTrackExercise[]) {
  const lines = exercises.map((exercise) => {
    const optional = exercise.optional ? " (optional)" : "";
    return `${exercise.name}: ${exercise.prescription}${optional}`;
  });
  return lines.join("; ");
}

export function applyEnrollmentTrackTasks(
  tasks: ProgramDailyTask[],
  programDayInfo: ProgramDayInfo,
  activeTracks?: ProgramActiveTrackInput[],
): ProgramDailyTask[] {
  if (
    !activeTracks?.length ||
    programDayInfo.dayOfWeek === 7 ||
    programDayInfo.isBeforeStart ||
    programDayInfo.isComplete ||
    programDayInfo.programDay <= 0
  ) {
    return tasks;
  }

  const weekNumber = programDayInfo.weekNumber > 0 ? programDayInfo.weekNumber : 1;
  const phaseKey = getTrackPhaseKey(weekNumber);
  const working = [...tasks];

  for (const active of activeTracks) {
    if (programDayInfo.programDay < active.startedProgramDay) {
      continue;
    }

    const definition = getProgramTrackDefinition(active.trackKey);
    if (!definition) {
      continue;
    }

    if (!definition.daysOfWeek.includes(programDayInfo.dayOfWeek)) {
      continue;
    }

    const exercises = definition.phases[phaseKey];
    const drills = definition.recommendedDrillVimeoIds
      ? resolveDrillsFromVimeoIds(definition.recommendedDrillVimeoIds, 2)
      : undefined;

    working.push({
      key: buildTrackTaskKey(programDayInfo.programDay, definition.key),
      type: "track",
      title: definition.label,
      target: `${definition.minutesLabel} | ${formatExerciseTarget(exercises)}`,
      targetDetail: definition.equipment,
      needsNote: true,
      trackKey: definition.key,
      trackSafetyNote: definition.safetyNote,
      trackEquipmentNote: definition.equipmentNote,
      trackEquipmentNoteUrl: definition.equipmentNoteUrl,
      trackExercises: exercises,
      drills,
    });
  }

  return working;
}
