import { getWorkoutPdfUrl } from "@/lib/workouts";
import type { AgeGroupKey } from "@/lib/workout-programs";

export const MY_RESOURCES_AGE_GROUPS: { key: AgeGroupKey; label: string }[] = [
  { key: "8-11", label: "Ages 8-11" },
  { key: "12-15", label: "Ages 12-15" },
  { key: "16-18", label: "Ages 16+" },
];

export const MY_RESOURCES_GUIDE_FILENAMES = [
  "LCB_PreGame_Warmup.pdf",
  "LCB_Parent_Guide.pdf",
  "LCB_Nutrition_Guide.pdf",
  "LCB_Arm_Care_4Week_Starter.pdf",
  "LCB_Mental_Game_Workbook.pdf",
  "LCB_Recruiting_Guide.pdf",
] as const;

export type MyResourcesProgramKey = "strength" | "speed" | "mobility" | "rotational";

export const MY_RESOURCES_PROGRAMS: {
  key: MyResourcesProgramKey;
  title: string;
  layout: "phases" | "single";
}[] = [
  { key: "strength", title: "Strength", layout: "phases" },
  { key: "speed", title: "Speed and Agility", layout: "phases" },
  { key: "mobility", title: "Mobility", layout: "single" },
  { key: "rotational", title: "Rotational Power", layout: "single" },
];

const phaseLabels = ["Phase 1", "Phase 2", "Phase 3"] as const;

export function buildStrengthPhaseFilename(ageKey: AgeGroupKey, phase: 1 | 2 | 3) {
  return `LCB_Strength_${ageKey}_Phase${phase}.pdf`;
}

export function buildSpeedPhaseFilename(ageKey: AgeGroupKey, phase: 1 | 2 | 3) {
  return `LCB_Speed-Agility_${ageKey}_Phase${phase}.pdf`;
}

export function buildMobilityFilename(ageKey: AgeGroupKey) {
  return `LCB_Mobility_${ageKey}.pdf`;
}

export const ROTATIONAL_POWER_FILENAME = "LCB_Rotational_Sample.pdf";

export function buildWorkoutPdfApiHref(filename: string, download = false) {
  const base = getWorkoutPdfUrl(filename);
  if (!download) {
    return base;
  }
  return `${base}?download=1`;
}

export function buildGuidePdfApiHref(filename: string, download = false) {
  const base = `/api/workout-resources/${encodeURIComponent(filename)}`;
  if (!download) {
    return base;
  }
  return `${base}?download=1`;
}

export function phaseLabel(index: number) {
  return phaseLabels[index] ?? `Phase ${index + 1}`;
}
