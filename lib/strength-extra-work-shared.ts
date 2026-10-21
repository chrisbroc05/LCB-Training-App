import {
  PROGRAM_AGE_GROUP_WORKOUT_AGE,
  type ProgramAgeGroup,
} from "@/lib/program-enrollment-shared";
import type { ProgramTrackExercise } from "@/lib/program-tracks";
import type { StrengthVariant } from "@/lib/strength-variant-shared";
import type { WorkoutId } from "@/lib/workout-program-types";

export const STRENGTH_EXTRA_WORK_TASK_TITLE = "Optional - Extra Work";
export const STRENGTH_EXTRA_WORK_TARGET = "10-15 min of accessories";
export const STRENGTH_EXTRA_WORK_TARGET_DETAIL =
  "Core, single-leg, and upper-back work. Skip anytime - your day still counts.";

type ExtraWorkKey = `${"12-15" | "16-18"}:${StrengthVariant}:${WorkoutId}`;

const STRENGTH_EXTRA_WORK: Partial<Record<ExtraWorkKey, ProgramTrackExercise[]>> = {
  "12-15:gym:A": [
    {
      name: "Side plank with hip dip",
      prescription: "2x10 each side, 30 sec rest",
      formCue: "Forearm down, hips up, lower your hip toward the floor and lift back up.",
    },
    {
      name: "Single-leg glute bridge",
      prescription: "2x10 each leg, 45 sec rest",
      formCue: "One foot in the air, drive through the heel on the floor, pause at the top.",
    },
    {
      name: "Prone Y-T-W",
      prescription: "2x6 each shape, 30 sec rest",
      formCue: "Lie face down, thumbs up, lift arms into Y, then T, then W without arching your back.",
    },
  ],
  "16-18:gym:A": [
    {
      name: "Side plank with hip dip",
      prescription: "3x10 each side, 30 sec rest",
      formCue: "Forearm down, hips up, lower your hip toward the floor and lift back up.",
    },
    {
      name: "Bodyweight single-leg RDL",
      prescription: "2x8 each leg, 45 sec rest",
      formCue: "Hinge on one leg, back leg goes straight back, hips stay square, chest tall.",
    },
    {
      name: "Band pull-apart or prone Y-T-W",
      prescription: "2x15 pull-aparts or 2x8 each shape",
      formCue: "Pull-apart: arms straight, squeeze shoulder blades. Y-T-W: lie face down, thumbs up, slow lifts.",
    },
  ],
  "12-15:gym:B": [
    {
      name: "Dead bug",
      prescription: "2x8 each side, slow",
      formCue: "Low back flat on the floor, opposite arm and leg move together under control.",
    },
    {
      name: "Half-kneeling anti-rotation hold (hands pressed together)",
      prescription: "2x20 sec each side",
      formCue: "Kneel on one knee, press palms together at your chest, resist twisting for the whole hold.",
    },
    {
      name: "Open-book thoracic rotation",
      prescription: "2x8 each side",
      formCue: "On your side, knees bent, open the top arm like a book and follow your hand with your eyes.",
    },
  ],
  "16-18:gym:B": [
    {
      name: "Dead bug",
      prescription: "2x10 each side, slow",
      formCue: "Low back flat on the floor, opposite arm and leg move together under control.",
    },
    {
      name: "Open-book thoracic rotation",
      prescription: "2x8 each side",
      formCue: "On your side, knees bent, open the top arm like a book and follow your hand with your eyes.",
    },
    {
      name: "Face pull (band) or prone Y-T-W",
      prescription: "2x12 face pulls or 2x8 each shape",
      formCue: "Face pull: elbows high, pull toward your face. Y-T-W: lie face down, thumbs up, squeeze shoulder blades.",
    },
  ],
  "12-15:bodyweight:B": [
    {
      name: "Dead bug",
      prescription: "2x8 each side, slow",
      formCue: "Low back flat on the floor, opposite arm and leg move together under control.",
    },
    {
      name: "Open-book thoracic rotation",
      prescription: "2x8 each side",
      formCue: "On your side, knees bent, open the top arm like a book and follow your hand with your eyes.",
    },
    {
      name: "Single-leg glute bridge",
      prescription: "2x10 each leg",
      formCue: "One foot in the air, drive through the heel on the floor, pause at the top.",
    },
  ],
  "16-18:bodyweight:B": [
    {
      name: "Dead bug",
      prescription: "2x10 each side, slow",
      formCue: "Low back flat on the floor, opposite arm and leg move together under control.",
    },
    {
      name: "Side plank with hip dips",
      prescription: "2x10 each side",
      formCue: "Forearm down, hips up, lower your hip toward the floor and lift back up.",
    },
    {
      name: "Prone Y-T-W",
      prescription: "2x8 each shape",
      formCue: "Lie face down, thumbs up, lift arms into Y, then T, then W without arching your back.",
    },
  ],
  "12-15:home_weights:B": [
    {
      name: "Dead bug",
      prescription: "2x8 each side, slow",
      formCue: "Low back flat on the floor, opposite arm and leg move together under control.",
    },
    {
      name: "Half-kneeling anti-rotation hold (hands pressed together)",
      prescription: "2x20 sec each side",
      formCue: "Kneel on one knee, press palms together at your chest, resist twisting for the whole hold.",
    },
    {
      name: "Prone Y-T-W",
      prescription: "2x6 each shape",
      formCue: "Lie face down, thumbs up, lift arms into Y, then T, then W without arching your back.",
    },
  ],
  "16-18:home_weights:B": [
    {
      name: "Dead bug",
      prescription: "2x10 each side, slow",
      formCue: "Low back flat on the floor, opposite arm and leg move together under control.",
    },
    {
      name: "Backpack row (light, chest on couch)",
      prescription: "2x12",
      formCue: "Hinge with a flat back, pull a lightly loaded backpack to your ribs, squeeze shoulder blades.",
    },
    {
      name: "Open-book thoracic rotation",
      prescription: "2x8 each side",
      formCue: "On your side, knees bent, open the top arm like a book and follow your hand with your eyes.",
    },
  ],
};

export function getStrengthExtraWorkExercises(
  ageGroup: ProgramAgeGroup,
  variant: StrengthVariant,
  workoutId: WorkoutId,
): ProgramTrackExercise[] | null {
  if (ageGroup === "AGE_8_11") {
    return null;
  }

  if (variant !== "gym" && workoutId === "A") {
    return null;
  }

  const workoutAge = PROGRAM_AGE_GROUP_WORKOUT_AGE[ageGroup];
  if (workoutAge === "8-11") {
    return null;
  }

  const key = `${workoutAge}:${variant}:${workoutId}` as ExtraWorkKey;
  return STRENGTH_EXTRA_WORK[key] ?? null;
}

export function isStrengthExtraTaskKey(taskKey: string) {
  return /-strength-extra-[ab]$/.test(taskKey);
}
