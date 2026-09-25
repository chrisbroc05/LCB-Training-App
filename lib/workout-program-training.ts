import { WORKOUT_CUES_SUPPLEMENTARY } from "@/lib/workout-cues-supplementary";
import { WORKOUT_PROGRAMS } from "@/lib/workout-program-data.generated";
import type {
  WorkoutAgeGroup,
  WorkoutCategory,
  WorkoutId,
  WorkoutProgram,
  WorkoutWithCues,
} from "@/lib/workout-program-types";

const EXERCISE_QUALIFIERS = ["empty hands"] as const;

const PAREN_QUALIFIER_PATTERNS = [
  /all\s+.+\s+movements/i,
  /final\s+timed\s+test/i,
  /final\s+timed/i,
  /chase\s+your\s+pr/i,
  /chase\s+pr/i,
  /max\s+effort/i,
  /max/i,
  /timed/i,
  /weighted\s+if\s+possible/i,
  /or\s+band-assisted/i,
  /weighted/i,
  /heavy/i,
  /coach\s+calls\s+direction/i,
  /light\s+db/i,
  /light\s+band\s+optional/i,
  /batting\s+stance/i,
  /bodyweight/i,
];

const TRAILING_QUALIFIERS = [
  "final timed test",
  "final timed",
  "chase your pr",
  "chase pr",
  "max effort",
  "timed",
  "max",
  "weighted",
  "heavy",
];

const EXERCISE_ALIASES: Record<string, string> = {
  "Nordic Curl": "Nordic Hamstring Curl",
  "Chin-Up": "Chin-Up / Pull-Up",
  "DB Bench": "DB Bench Press",
  "5-10-5": "5-10-5 Agility",
  "5-10-5 Pro Agility": "5-10-5 Agility",
  "Read & React": "Read & React Sprint",
  "Icky Shuffle": "Ladder - Icky Shuffle",
  "Icky Shuffle ladder": "Ladder - Icky Shuffle",
  "Ladder in-out": "Ladder - In-In-Out-Out",
  "Ladder two feet in": "Ladder - Two Feet In Each",
  "Ladder two-in": "Ladder - Lateral Two-In",
  "Base Running": "Base-Running Footwork",
  "Base-Running Footwork Pattern": "Base-Running Footwork",
  "Light Jog or Bike": "Light Jog",
  "Light Jog or Jump Rope": "Light Jog",
  "Leg Swings (front/side)": "Leg Swings",
  "Leg Swings (front/back, side)": "Leg Swings",
  Squat: "Bodyweight Squat",
  "Bodyweight Squat": "Bodyweight Squat",
  "Squat (light band optional)": "Bodyweight Squat",
  "Reverse Lunge (bodyweight)": "Reverse Lunge",
  "Full Body Flow": "Full Body Mobility Flow",
  "Lateral shuffle": "Lateral Shuffle",
};

const MASTER_GLOSSARY = buildMasterGlossary(WORKOUT_PROGRAMS);

function buildMasterGlossary(programs: WorkoutProgram[]): Record<string, string> {
  const master: Record<string, string> = {};
  for (const program of programs) {
    for (const [name, cue] of Object.entries(program.glossary)) {
      if (!(name in master)) {
        master[name] = cue;
      }
    }
  }
  return master;
}

function findProgram(
  category: WorkoutCategory,
  ageGroup: WorkoutAgeGroup,
): WorkoutProgram | undefined {
  return WORKOUT_PROGRAMS.find(
    (program) => program.category === category && program.ageGroup === ageGroup,
  );
}

function expandExerciseAliases(name: string): string {
  return name.replace(/\bRDL\b/g, "Romanian Deadlift");
}

function getExerciseQualifiers(name: string): string[] {
  const lower = name.toLowerCase();
  return EXERCISE_QUALIFIERS.filter((qualifier) => lower.includes(qualifier));
}

function stripQualifiers(name: string): string {
  let result = name.replace(/\(\s*all[^)]*movements\s*\)/gi, "");

  result = result.replace(/\([^)]*\)/g, (match) => {
    const inner = match.slice(1, -1);
    if (PAREN_QUALIFIER_PATTERNS.some((pattern) => pattern.test(inner))) {
      return "";
    }
    return match;
  });

  for (const qualifier of TRAILING_QUALIFIERS) {
    result = result.replace(new RegExp(`\\s+${qualifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "");
  }

  return result.replace(/\s+/g, " ").trim();
}

function applyExerciseAliases(name: string): string {
  const trimmed = name.trim();
  if (EXERCISE_ALIASES[trimmed]) {
    return EXERCISE_ALIASES[trimmed];
  }

  const withoutParens = trimmed.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  if (EXERCISE_ALIASES[withoutParens]) {
    return EXERCISE_ALIASES[withoutParens];
  }

  return trimmed;
}

function normalizeExerciseForLookup(name: string): string {
  return applyExerciseAliases(stripQualifiers(expandExerciseAliases(name)));
}

function compareKey(name: string): string {
  return normalizeExerciseForLookup(name)
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function glossaryKeyMatchesQualifiers(
  exerciseName: string,
  glossaryKey: string,
): boolean {
  const exerciseQualifiers = getExerciseQualifiers(exerciseName);
  if (exerciseQualifiers.length === 0) {
    return getExerciseQualifiers(glossaryKey).length === 0;
  }

  const glossaryLower = glossaryKey.toLowerCase();
  return exerciseQualifiers.every((qualifier) => glossaryLower.includes(qualifier));
}

function lookupInGlossary(
  exerciseName: string,
  glossary: Record<string, string>,
): string | undefined {
  const normalizedExercise = normalizeExerciseForLookup(exerciseName);
  const exerciseKey = compareKey(exerciseName);

  if (glossary[exerciseName] && glossaryKeyMatchesQualifiers(exerciseName, exerciseName)) {
    return glossary[exerciseName];
  }

  if (
    glossary[normalizedExercise] &&
    glossaryKeyMatchesQualifiers(exerciseName, normalizedExercise)
  ) {
    return glossary[normalizedExercise];
  }

  for (const [key, cue] of Object.entries(glossary)) {
    if (!glossaryKeyMatchesQualifiers(exerciseName, key)) {
      continue;
    }
    if (compareKey(key) === exerciseKey) {
      return cue;
    }
  }

  for (const [key, cue] of Object.entries(glossary)) {
    if (!glossaryKeyMatchesQualifiers(exerciseName, key)) {
      continue;
    }
    const keyNorm = compareKey(key);
    if (exerciseKey.startsWith(keyNorm) || keyNorm.startsWith(exerciseKey)) {
      return cue;
    }
  }

  return undefined;
}

function lookupFormCue(
  exerciseName: string,
  programGlossary: Record<string, string>,
): string | undefined {
  for (const glossary of [
    programGlossary,
    MASTER_GLOSSARY,
    WORKOUT_CUES_SUPPLEMENTARY,
  ]) {
    const cue = lookupInGlossary(exerciseName, glossary);
    if (cue) {
      return cue;
    }
  }

  return undefined;
}

export function getWorkout(
  category: WorkoutCategory,
  ageGroup: WorkoutAgeGroup,
  weekNumber: number,
  workoutId: WorkoutId,
): WorkoutWithCues | null {
  const program = findProgram(category, ageGroup);
  if (!program) {
    return null;
  }

  const week = program.weeks.find((entry) => entry.weekNumber === weekNumber);
  if (!week) {
    return null;
  }

  const workout = week.workouts[workoutId];
  if (!workout) {
    return null;
  }

  return {
    ...workout,
    weekNumber: week.weekNumber,
    phase: week.phase,
    category: program.category,
    ageGroup: program.ageGroup,
    sections: workout.sections.map((section) => ({
      ...section,
      exercises: section.exercises.map((exercise) => ({
        ...exercise,
        rest: exercise.rest ?? "-",
        formCue: lookupFormCue(exercise.name, program.glossary),
      })),
    })),
  };
}

export { WORKOUT_PROGRAMS, MASTER_GLOSSARY };
