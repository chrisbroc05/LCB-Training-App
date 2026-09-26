import {
  applyHalfReps,
  CORE_TASK_8_11,
  FIELDING_EMPHASIS_BY_PHASE,
  FIELDING_FOOTWORK_LINE,
  FIELDING_REPS_BY_AGE_PHASE,
  getFieldingIdeasForEquipment,
  getHittingIdeasForEquipment,
  getPlaybookChapterForWeek,
  HITTING_FOCUS_CUES,
  HITTING_SWINGS_BY_AGE_PHASE,
  IN_SEASON_MOBILITY_NOTE,
  IN_SEASON_SPEED_STRENGTH_NOTE,
  getMindsetPromptForDay,
  MINDSET_WEEK_CONTENT,
  SATURDAY_REFLECTION_FIELDS,
  SPRINT_TASK_BY_AGE,
  SPRINT_TASK_IN_SEASON_BY_AGE,
  IN_SEASON_SPRINT_NOTE,
  toContentPhase,
} from "@/lib/program-content";
import {
  getFieldingDrillsForDay,
  getHittingDrillsForDay,
  getMindsetDrillsForDay,
  type ProgramDrillRef,
} from "@/lib/program-drill-tags";
import {
  PROGRAM_AGE_GROUP_LABELS,
  type ProgramAgeGroup,
  type ProgramEquipmentOption,
  type ProgramFocusArea,
  type ProgramSeasonMode,
} from "@/lib/program-enrollment-shared";
import type { ProgramDayInfo } from "@/lib/program-schedule";
import type { WorkoutAgeGroup, WorkoutCategory, WorkoutId } from "@/lib/workout-program-types";

export type ProgramTaskType =
  | "hitting"
  | "fielding"
  | "speed"
  | "strength"
  | "mobility"
  | "mindset"
  | "playbook"
  | "reflection"
  | "sprint"
  | "core";

export type ProgramWorkoutRef = {
  category: WorkoutCategory;
  ageGroup: WorkoutAgeGroup;
  week: number;
  workoutId: WorkoutId;
};

export type ProgramDailyTask = {
  key: string;
  type: ProgramTaskType;
  title: string;
  target: string;
  focus?: string;
  ideas?: string[];
  drills?: ProgramDrillRef[];
  workout?: ProgramWorkoutRef;
  needsNote: boolean;
  inSeasonNote?: string;
  halfReps?: boolean;
  playbookChapter?: number;
  playbookHref?: string;
  mindsetPrompt?: string;
  reflectionFields?: Array<{ key: string; label: string }>;
};

export type ProgramEnrollmentPlanInput = {
  ageGroup: ProgramAgeGroup;
  focusAreas: ProgramFocusArea[];
  equipment: ProgramEquipmentOption[];
  seasonMode: ProgramSeasonMode;
  knownFor?: string | null;
};

type InternalTask = ProgramDailyTask & {
  dropRank: number;
  isFocusExtra: boolean;
  removable: boolean;
  isMobility: boolean;
};

const DROP_RANK = {
  keep: 100,
  sprint: 10,
  mobilityWed: 20,
  core: 30,
  extraMindset: 40,
} as const;

function toWorkoutAgeGroup(ageGroup: ProgramAgeGroup): WorkoutAgeGroup {
  return PROGRAM_AGE_GROUP_LABELS[ageGroup] as WorkoutAgeGroup;
}

function hasFocus(focusAreas: ProgramFocusArea[], area: ProgramFocusArea) {
  return focusAreas.includes(area);
}

function makeWorkoutRef(
  category: WorkoutCategory,
  ageGroup: ProgramAgeGroup,
  weekNumber: number,
  workoutId: WorkoutId,
): ProgramWorkoutRef {
  return {
    category,
    ageGroup: toWorkoutAgeGroup(ageGroup),
    week: weekNumber,
    workoutId,
  };
}

function buildHittingTask(
  programDay: number,
  suffix: string,
  ageGroup: ProgramAgeGroup,
  phase: ReturnType<typeof toContentPhase>,
  weekNumber: number,
  dayOfWeek: number,
  equipment: ProgramEquipmentOption[],
  isFocusExtra: boolean,
  halfReps = false,
): InternalTask {
  const baseReps = HITTING_SWINGS_BY_AGE_PHASE[ageGroup][phase];
  const reps = halfReps ? applyHalfReps(baseReps) : baseReps;
  const cue = HITTING_FOCUS_CUES[weekNumber] ?? HITTING_FOCUS_CUES[1];

  return {
    key: `p${programDay}-hitting${suffix}`,
    type: "hitting",
    title: "Hitting",
    target: `${reps} swings`,
    focus: `Focus: ${cue}`,
    ideas: getHittingIdeasForEquipment(equipment),
    drills: getHittingDrillsForDay(weekNumber, dayOfWeek),
    needsNote: true,
    halfReps,
    dropRank: DROP_RANK.keep,
    isFocusExtra,
    removable: false,
    isMobility: false,
  };
}

function buildFieldingTask(
  programDay: number,
  suffix: string,
  ageGroup: ProgramAgeGroup,
  phase: ReturnType<typeof toContentPhase>,
  weekNumber: number,
  dayOfWeek: number,
  equipment: ProgramEquipmentOption[],
  isFocusExtra: boolean,
  halfReps = false,
): InternalTask {
  const baseReps = FIELDING_REPS_BY_AGE_PHASE[ageGroup][phase];
  const reps = halfReps ? applyHalfReps(baseReps) : baseReps;
  const emphasis = FIELDING_EMPHASIS_BY_PHASE[phase];

  return {
    key: `p${programDay}-fielding${suffix}`,
    type: "fielding",
    title: "Fielding",
    target: `${reps} fielding reps`,
    focus: `${emphasis.summary} ${emphasis.example} ${FIELDING_FOOTWORK_LINE}`,
    ideas: getFieldingIdeasForEquipment(equipment),
    drills: getFieldingDrillsForDay(phase, weekNumber, dayOfWeek),
    needsNote: true,
    halfReps,
    dropRank: DROP_RANK.keep,
    isFocusExtra,
    removable: false,
    isMobility: false,
  };
}

function buildSpeedTask(
  programDay: number,
  workoutId: WorkoutId,
  ageGroup: ProgramAgeGroup,
  weekNumber: number,
  inSeasonNote?: string,
  removable = false,
): InternalTask {
  return {
    key: `p${programDay}-speed-${workoutId.toLowerCase()}`,
    type: "speed",
    title: workoutId === "A" ? "Speed Workout A" : "Speed Workout B",
    target: "Complete the speed workout",
    workout: makeWorkoutRef("speed_agility", ageGroup, weekNumber, workoutId),
    needsNote: true,
    inSeasonNote,
    dropRank: DROP_RANK.keep,
    isFocusExtra: false,
    removable,
    isMobility: false,
  };
}

function buildStrengthTask(
  programDay: number,
  workoutId: WorkoutId,
  ageGroup: ProgramAgeGroup,
  weekNumber: number,
  inSeasonNote?: string,
  removable = false,
): InternalTask {
  return {
    key: `p${programDay}-strength-${workoutId.toLowerCase()}`,
    type: "strength",
    title: workoutId === "A" ? "Strength Workout A" : "Strength Workout B",
    target: "Complete the strength workout",
    workout: makeWorkoutRef("strength", ageGroup, weekNumber, workoutId),
    needsNote: true,
    inSeasonNote,
    dropRank: DROP_RANK.keep,
    isFocusExtra: false,
    removable,
    isMobility: false,
  };
}

function buildMobilityTask(
  programDay: number,
  suffix: string,
  ageGroup: ProgramAgeGroup,
  weekNumber: number,
  inSeasonNote?: string,
  removable = false,
): InternalTask {
  return {
    key: `p${programDay}-mobility${suffix}`,
    type: "mobility",
    title: "Mobility",
    target: "Complete the mobility flow",
    workout: makeWorkoutRef("mobility", ageGroup, weekNumber, "A"),
    needsNote: true,
    inSeasonNote,
    dropRank: dayOfWeekIsWednesdaySuffix(suffix) ? DROP_RANK.mobilityWed : DROP_RANK.mobilityWed,
    isFocusExtra: false,
    removable,
    isMobility: true,
  };
}

function dayOfWeekIsWednesdaySuffix(suffix: string) {
  return suffix === "-wed" || suffix === "";
}

function buildMindsetTask(
  programDay: number,
  suffix: string,
  weekNumber: number,
  dayOfWeek: number,
  isFocusExtra: boolean,
): InternalTask {
  const content = MINDSET_WEEK_CONTENT[weekNumber] ?? MINDSET_WEEK_CONTENT[1];
  const prompt = getMindsetPromptForDay(weekNumber, dayOfWeek);

  return {
    key: `p${programDay}-mindset${suffix}`,
    type: "mindset",
    title: content.theme,
    target: prompt,
    mindsetPrompt: prompt,
    drills: getMindsetDrillsForDay(weekNumber, dayOfWeek),
    needsNote: true,
    dropRank: isFocusExtra ? DROP_RANK.extraMindset : DROP_RANK.keep,
    isFocusExtra,
    removable: isFocusExtra,
    isMobility: false,
  };
}

function buildPlaybookTask(
  programDay: number,
  suffix: string,
  chapterNumber: number,
  isRead: boolean,
): InternalTask {
  return {
    key: `p${programDay}-playbook${suffix}`,
    type: "playbook",
    title: isRead ? `Read Chapter ${chapterNumber}` : `One thing you're taking from Chapter ${chapterNumber}`,
    target: isRead
      ? `Open chapter ${chapterNumber} in the playbook.`
      : "Write one takeaway from this chapter.",
    playbookChapter: chapterNumber,
    playbookHref: "/playbook",
    needsNote: !isRead,
    dropRank: DROP_RANK.keep,
    isFocusExtra: false,
    removable: false,
    isMobility: false,
  };
}

function buildReflectionTask(programDay: number): InternalTask {
  return {
    key: `p${programDay}-reflection`,
    type: "reflection",
    title: "Saturday reflection",
    target: "Answer all three reflection questions.",
    reflectionFields: SATURDAY_REFLECTION_FIELDS.map((field) => ({
      key: field.key,
      label: field.label,
    })),
    needsNote: true,
    dropRank: DROP_RANK.keep,
    isFocusExtra: false,
    removable: false,
    isMobility: false,
  };
}

function buildSprintTask(
  programDay: number,
  ageGroup: ProgramAgeGroup,
  inSeason: boolean,
): InternalTask {
  return {
    key: `p${programDay}-sprint`,
    type: "sprint",
    title: "Speed focus sprints",
    target: inSeason ? SPRINT_TASK_IN_SEASON_BY_AGE[ageGroup] : SPRINT_TASK_BY_AGE[ageGroup],
    inSeasonNote: inSeason ? IN_SEASON_SPRINT_NOTE : undefined,
    needsNote: true,
    dropRank: DROP_RANK.sprint,
    isFocusExtra: true,
    removable: true,
    isMobility: false,
  };
}

function buildCoreTask(programDay: number): InternalTask {
  return {
    key: `p${programDay}-core`,
    type: "core",
    title: "Core work",
    target: CORE_TASK_8_11,
    needsNote: true,
    dropRank: DROP_RANK.core,
    isFocusExtra: true,
    removable: true,
    isMobility: false,
  };
}

function buildMindsetOrPlaybookSlot(
  programDay: number,
  suffix: string,
  weekNumber: number,
  dayOfWeek: number,
  isReadDay: boolean,
  isFocusExtra: boolean,
) {
  const chapter = getPlaybookChapterForWeek(weekNumber);
  if (chapter) {
    return buildPlaybookTask(programDay, suffix, chapter, isReadDay);
  }

  return buildMindsetTask(programDay, suffix, weekNumber, dayOfWeek, isFocusExtra);
}

function buildBaseTasks(
  enrollment: ProgramEnrollmentPlanInput,
  programDayInfo: ProgramDayInfo,
  inSeason: boolean,
) {
  const { ageGroup, focusAreas, equipment } = enrollment;
  const { programDay, weekNumber, dayOfWeek, phase } = programDayInfo;
  const contentPhase = toContentPhase(phase);
  const tasks: InternalTask[] = [];

  if (dayOfWeek === 7) {
    return tasks;
  }

  const speedStrengthNote = inSeason ? IN_SEASON_SPEED_STRENGTH_NOTE : undefined;
  const mobilityNote = inSeason ? IN_SEASON_MOBILITY_NOTE : undefined;

  if (dayOfWeek === 1) {
    tasks.push(
      buildHittingTask(programDay, "", ageGroup, contentPhase, weekNumber, dayOfWeek, equipment, false),
    );
    if (!inSeason) {
      tasks.push(buildSpeedTask(programDay, "A", ageGroup, weekNumber));
    }
    tasks.push(buildMindsetOrPlaybookSlot(programDay, "", weekNumber, dayOfWeek, true, false));
    if (hasFocus(focusAreas, "fielding")) {
      tasks.push(
        buildFieldingTask(
          programDay,
          "-focus",
          ageGroup,
          contentPhase,
          weekNumber,
          dayOfWeek,
          equipment,
          true,
        ),
      );
    }
    if (inSeason) {
      tasks.push(buildMobilityTask(programDay, "-in-season", ageGroup, weekNumber, mobilityNote, true));
    }
  }

  if (dayOfWeek === 2) {
    tasks.push(
      buildFieldingTask(programDay, "", ageGroup, contentPhase, weekNumber, dayOfWeek, equipment, false),
    );
    if (!inSeason) {
      tasks.push(buildStrengthTask(programDay, "A", ageGroup, weekNumber));
    }
    if (hasFocus(focusAreas, "hitting")) {
      tasks.push(
        buildHittingTask(
          programDay,
          "-focus",
          ageGroup,
          contentPhase,
          weekNumber,
          dayOfWeek,
          equipment,
          true,
        ),
      );
    }
    if (hasFocus(focusAreas, "mental")) {
      tasks.push(buildMindsetTask(programDay, "-focus", weekNumber, dayOfWeek, true));
    }
    if (inSeason) {
      tasks.push(buildMobilityTask(programDay, "-in-season", ageGroup, weekNumber, mobilityNote, true));
    }
  }

  if (dayOfWeek === 3) {
    tasks.push(
      buildHittingTask(programDay, "", ageGroup, contentPhase, weekNumber, dayOfWeek, equipment, false),
    );
    tasks.push(
      buildFieldingTask(programDay, "", ageGroup, contentPhase, weekNumber, dayOfWeek, equipment, false),
    );
    tasks.push(buildMobilityTask(programDay, "-wed", ageGroup, weekNumber, mobilityNote, !inSeason));
    if (hasFocus(focusAreas, "speed")) {
      tasks.push(buildSprintTask(programDay, ageGroup, inSeason));
    }
    if (hasFocus(focusAreas, "mental")) {
      tasks.push(buildMindsetTask(programDay, "-focus", weekNumber, dayOfWeek, true));
    }
  }

  if (dayOfWeek === 4) {
    tasks.push(
      buildHittingTask(programDay, "", ageGroup, contentPhase, weekNumber, dayOfWeek, equipment, false),
    );
    tasks.push(
      buildSpeedTask(programDay, "B", ageGroup, weekNumber, speedStrengthNote),
    );
    tasks.push(buildMindsetOrPlaybookSlot(programDay, "", weekNumber, dayOfWeek, false, false));
    if (hasFocus(focusAreas, "fielding")) {
      tasks.push(
        buildFieldingTask(
          programDay,
          "-focus",
          ageGroup,
          contentPhase,
          weekNumber,
          dayOfWeek,
          equipment,
          true,
        ),
      );
    }
    if (inSeason) {
      tasks.push(buildMobilityTask(programDay, "-in-season", ageGroup, weekNumber, mobilityNote, true));
    }
  }

  if (dayOfWeek === 5) {
    tasks.push(
      buildFieldingTask(programDay, "", ageGroup, contentPhase, weekNumber, dayOfWeek, equipment, false),
    );
    tasks.push(
      buildStrengthTask(programDay, "B", ageGroup, weekNumber, speedStrengthNote),
    );
    if (hasFocus(focusAreas, "hitting")) {
      tasks.push(
        buildHittingTask(
          programDay,
          "-focus",
          ageGroup,
          contentPhase,
          weekNumber,
          dayOfWeek,
          equipment,
          true,
        ),
      );
    }
    if (hasFocus(focusAreas, "mental")) {
      tasks.push(buildMindsetTask(programDay, "-focus", weekNumber, dayOfWeek, true));
    }
    if (inSeason) {
      tasks.push(buildMobilityTask(programDay, "-in-season", ageGroup, weekNumber, mobilityNote, true));
    }
  }

  if (dayOfWeek === 6) {
    tasks.push(buildReflectionTask(programDay));
    tasks.push(buildMobilityTask(programDay, "-sat", ageGroup, weekNumber, mobilityNote, false));
  }

  return tasks;
}

function applyWednesdayStrengthRules(
  tasks: InternalTask[],
  enrollment: ProgramEnrollmentPlanInput,
  programDayInfo: ProgramDayInfo,
  inSeason: boolean,
) {
  if (programDayInfo.dayOfWeek !== 3 || inSeason) {
    return;
  }

  const hasStrengthA = tasks.some(
    (task) => task.type === "strength" && task.workout?.workoutId === "A",
  );

  if (enrollment.ageGroup === "AGE_16_18" && !hasStrengthA) {
    tasks.push(
      buildStrengthTask(
        programDayInfo.programDay,
        "A",
        enrollment.ageGroup,
        programDayInfo.weekNumber,
      ),
    );
    return;
  }

  if (hasFocus(enrollment.focusAreas, "strength") && enrollment.ageGroup !== "AGE_8_11" && !hasStrengthA) {
    tasks.push(
      buildStrengthTask(
        programDayInfo.programDay,
        "A",
        enrollment.ageGroup,
        programDayInfo.weekNumber,
      ),
    );
    return;
  }

  if (
    hasFocus(enrollment.focusAreas, "strength") &&
    enrollment.ageGroup === "AGE_8_11" &&
    !tasks.some((task) => task.type === "core")
  ) {
    tasks.push(buildCoreTask(programDayInfo.programDay));
  }
}

function applyInSeasonHalfReps(tasks: InternalTask[], enrollment: ProgramEnrollmentPlanInput, programDayInfo: ProgramDayInfo) {
  const contentPhase = toContentPhase(programDayInfo.phase);

  for (const task of tasks) {
    if (task.type === "hitting" && !task.halfReps) {
      const baseReps = HITTING_SWINGS_BY_AGE_PHASE[enrollment.ageGroup][contentPhase];
      task.target = `${applyHalfReps(baseReps)} swings`;
      task.halfReps = true;
    }

    if (task.type === "fielding" && !task.halfReps) {
      const baseReps = FIELDING_REPS_BY_AGE_PHASE[enrollment.ageGroup][contentPhase];
      task.target = `${applyHalfReps(baseReps)} fielding reps`;
      task.halfReps = true;
    }
  }
}

function enforceMaxTasks(
  tasks: InternalTask[],
  enrollment: ProgramEnrollmentPlanInput,
  programDayInfo: ProgramDayInfo,
  inSeason: boolean,
) {
  if (tasks.length <= 4) {
    return tasks;
  }

  const nonFocusSkill = tasks.find(
    (task) =>
      (task.type === "hitting" || task.type === "fielding") &&
      !task.isFocusExtra &&
      !task.halfReps,
  );

  if (nonFocusSkill) {
    const contentPhase = toContentPhase(programDayInfo.phase);
    if (nonFocusSkill.type === "hitting") {
      const baseReps = HITTING_SWINGS_BY_AGE_PHASE[enrollment.ageGroup][contentPhase];
      nonFocusSkill.target = `${inSeason ? applyHalfReps(baseReps) : applyHalfReps(baseReps)} swings`;
      nonFocusSkill.halfReps = true;
    } else {
      const baseReps = FIELDING_REPS_BY_AGE_PHASE[enrollment.ageGroup][contentPhase];
      nonFocusSkill.target = `${applyHalfReps(baseReps)} fielding reps`;
      nonFocusSkill.halfReps = true;
    }
  }

  let working = [...tasks];
  while (working.length > 4) {
    const removable = working
      .filter((task) => task.removable)
      .sort((left, right) => left.dropRank - right.dropRank);

    if (removable.length === 0) {
      break;
    }

    const dropTarget = removable[0];
    if (inSeason && programDayInfo.dayOfWeek === 6 && dropTarget.isMobility) {
      const alternate = removable.find((task) => !task.isMobility);
      if (!alternate) {
        break;
      }
      working = working.filter((task) => task.key !== alternate.key);
      continue;
    }

    working = working.filter((task) => task.key !== dropTarget.key);
  }

  return working;
}

function finalizeTasks(tasks: InternalTask[]): ProgramDailyTask[] {
  return tasks.map(({ dropRank, isFocusExtra, removable, isMobility, ...task }) => task);
}

export function getDailyPlan(
  enrollment: ProgramEnrollmentPlanInput,
  programDayInfo: ProgramDayInfo,
): ProgramDailyTask[] {
  if (programDayInfo.dayOfWeek === 7 || programDayInfo.isBeforeStart || programDayInfo.isComplete) {
    return [];
  }

  const inSeason = enrollment.seasonMode === "IN_SEASON";
  let tasks = buildBaseTasks(enrollment, programDayInfo, inSeason);
  applyWednesdayStrengthRules(tasks, enrollment, programDayInfo, inSeason);

  if (inSeason) {
    applyInSeasonHalfReps(tasks, enrollment, programDayInfo);
  }

  tasks = enforceMaxTasks(tasks, enrollment, programDayInfo, inSeason);
  return finalizeTasks(tasks);
}

export function getTaskKeysForDay(
  enrollment: ProgramEnrollmentPlanInput,
  programDayInfo: ProgramDayInfo,
) {
  return getDailyPlan(enrollment, programDayInfo).map((task) => task.key);
}

export function findDailyTask(
  enrollment: ProgramEnrollmentPlanInput,
  programDayInfo: ProgramDayInfo,
  taskKey: string,
) {
  return getDailyPlan(enrollment, programDayInfo).find((task) => task.key === taskKey) ?? null;
}
