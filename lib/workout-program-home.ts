import type { StrengthVariant } from "@/lib/strength-variant-shared";
import {
  HOME_STRENGTH_GLOSSARY,
  HOME_STRENGTH_SAFETY_NOTE,
  HOME_STRENGTH_TEMPLATES,
  type HomeStrengthTemplate,
} from "@/lib/workout-program-home-data";
import type {
  StructuredWorkout,
  WorkoutAgeGroup,
  WorkoutExercise,
  WorkoutId,
  WorkoutPhase,
  WorkoutWithCues,
} from "@/lib/workout-program-types";

const PHASE_END_COACH_NOTE =
  "Last week of this phase. Push the effort, keep the form.";

const JUMP_SPRINT_PATTERN =
  /jump|sprint|pogo|skater|hurdle hop|line hop|quick feet|shuffle|stair run|stair skip|stair sprint|broad jump|burpee|kettlebell swing|dumbbell jump squat/i;

function getPhaseForWeek(weekNumber: number): WorkoutPhase {
  if (weekNumber >= 9) {
    return "compete";
  }

  if (weekNumber >= 5) {
    return "build";
  }

  return "foundation";
}

function weekInPhase(weekNumber: number) {
  return ((weekNumber - 1) % 4) + 1;
}

function shouldApplyProgression(weekNumber: number) {
  const position = weekInPhase(weekNumber);
  return position === 3 || position === 4;
}

function shouldShowPhaseEndNote(weekNumber: number) {
  return weekInPhase(weekNumber) === 4;
}

function isJumpOrSprintExercise(name: string) {
  return JUMP_SPRINT_PATTERN.test(name);
}

function addReps(value: string, amount: number): string {
  if (/max minus 1/i.test(value)) {
    return value;
  }

  if (/^\d+\s*count$/i.test(value)) {
    return value;
  }

  if (/\d+\s*trips up/i.test(value)) {
    return value;
  }

  if (/\d+\s*feet/i.test(value)) {
    return value;
  }

  const rangeMatch = value.match(/^(\d+)\s*-\s*(\d+)(.*)$/);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]) + amount;
    const high = Number(rangeMatch[2]) + amount;
    return `${low}-${high}${rangeMatch[3] ?? ""}`;
  }

  const eachMatch = value.match(/^(\d+)(\s+each\s+.+)$/i);
  if (eachMatch) {
    return `${Number(eachMatch[1]) + amount}${eachMatch[2]}`;
  }

  const secMatch = value.match(/^(\d+)\s*sec(.*)$/i);
  if (secMatch) {
    return `${Number(secMatch[1]) + amount} sec${secMatch[2] ?? ""}`;
  }

  const repsMatch = value.match(/^(\d+)(.*)$/);
  if (repsMatch) {
    return `${Number(repsMatch[1]) + amount}${repsMatch[2] ?? ""}`;
  }

  return value;
}

function applyProgressionToRepsOrTime(name: string, repsOrTime: string, weekNumber: number) {
  if (!shouldApplyProgression(weekNumber) || isJumpOrSprintExercise(name)) {
    return repsOrTime;
  }

  if (/\d+\s*sec/i.test(repsOrTime)) {
    return addReps(repsOrTime, 5);
  }

  return addReps(repsOrTime, 2);
}

function applyProgressionToExercise(
  exercise: WorkoutExercise,
  weekNumber: number,
): WorkoutExercise {
  return {
    ...exercise,
    repsOrTime: applyProgressionToRepsOrTime(
      exercise.name,
      exercise.repsOrTime,
      weekNumber,
    ),
    alternativeRepsOrTime: exercise.alternativeRepsOrTime
      ? applyProgressionToRepsOrTime(
          exercise.alternativeName ?? exercise.name,
          exercise.alternativeRepsOrTime,
          weekNumber,
        )
      : undefined,
  };
}

function lookupHomeFormCue(name: string) {
  const trimmed = name.trim();
  if (HOME_STRENGTH_GLOSSARY[trimmed]) {
    return HOME_STRENGTH_GLOSSARY[trimmed];
  }

  const withoutParens = trimmed.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  if (HOME_STRENGTH_GLOSSARY[withoutParens]) {
    return HOME_STRENGTH_GLOSSARY[withoutParens];
  }

  return undefined;
}

function enrichExercise(exercise: WorkoutExercise, weekNumber: number): WorkoutExercise {
  const progressed = applyProgressionToExercise(exercise, weekNumber);
  return {
    ...progressed,
    rest: progressed.rest ?? "-",
    formCue: lookupHomeFormCue(progressed.name),
  };
}

function findHomeTemplate(params: {
  variant: StrengthVariant;
  ageGroup: "12-15" | "16-18";
  phase: WorkoutPhase;
  workoutId: WorkoutId;
}): HomeStrengthTemplate | undefined {
  return HOME_STRENGTH_TEMPLATES.find(
    (template) =>
      template.variant === params.variant &&
      template.ageGroup === params.ageGroup &&
      template.phase === params.phase &&
      template.workoutId === params.workoutId,
  );
}

export function buildHomeStrengthWorkout(params: {
  variant: StrengthVariant;
  ageGroup: "12-15" | "16-18";
  weekNumber: number;
  workoutId: WorkoutId;
}): StructuredWorkout | null {
  const phase = getPhaseForWeek(params.weekNumber);
  const template = findHomeTemplate({
    variant: params.variant,
    ageGroup: params.ageGroup,
    phase,
    workoutId: params.workoutId,
  });

  if (!template) {
    return null;
  }

  return {
    id: params.workoutId,
    title: template.title,
    safetyNote: HOME_STRENGTH_SAFETY_NOTE,
    coachNote: shouldShowPhaseEndNote(params.weekNumber) ? PHASE_END_COACH_NOTE : undefined,
    sections: template.sections.map((section) => ({
      ...section,
      exercises: section.exercises.map((exercise) =>
        enrichExercise(exercise, params.weekNumber),
      ),
    })),
  };
}

export function getHomeStrengthWorkout(params: {
  variant: StrengthVariant;
  ageGroup: WorkoutAgeGroup;
  weekNumber: number;
  workoutId: WorkoutId;
}): WorkoutWithCues | null {
  if (params.ageGroup === "8-11") {
    return null;
  }

  const workout = buildHomeStrengthWorkout({
    variant: params.variant,
    ageGroup: params.ageGroup,
    weekNumber: params.weekNumber,
    workoutId: params.workoutId,
  });

  if (!workout) {
    return null;
  }

  return {
    ...workout,
    weekNumber: params.weekNumber,
    phase: getPhaseForWeek(params.weekNumber),
    category: "strength",
    ageGroup: params.ageGroup,
    strengthVariant: params.variant,
  };
}

export function listHomeStrengthExerciseNames() {
  const names = new Set<string>();

  for (const template of HOME_STRENGTH_TEMPLATES) {
    for (const section of template.sections) {
      for (const exercise of section.exercises) {
        names.add(exercise.name);
        if (exercise.alternativeName) {
          names.add(exercise.alternativeName);
        }
      }
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}
