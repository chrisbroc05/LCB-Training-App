export type ProgramAgeGroup = "AGE_8_11" | "AGE_12_15" | "AGE_16_18";

export type ProgramSeasonMode = "IN_SEASON" | "OFF_SEASON";

export type ProgramEnrollmentStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export const PROGRAM_FOCUS_AREAS = [
  "hitting",
  "fielding",
  "speed",
  "strength",
  "mental",
] as const;

export type ProgramFocusArea = (typeof PROGRAM_FOCUS_AREAS)[number];

export const PROGRAM_EQUIPMENT_OPTIONS = [
  "cage_field",
  "tee_net",
  "glove_wall",
  "weights_gym",
  "nothing_special",
] as const;

export type ProgramEquipmentOption = (typeof PROGRAM_EQUIPMENT_OPTIONS)[number];

export const PROGRAM_POSITION_OPTIONS = [
  "Pitcher",
  "Catcher",
  "Middle infield (SS/2B)",
  "Corner infield (3B/1B)",
  "Outfield",
  "Utility",
] as const;

export const PROGRAM_AGE_GROUP_LABELS: Record<ProgramAgeGroup, string> = {
  AGE_8_11: "8-11",
  AGE_12_15: "12-15",
  AGE_16_18: "16-18",
};

export const PROGRAM_SEASON_MODE_LABELS: Record<ProgramSeasonMode, string> = {
  IN_SEASON: "In season",
  OFF_SEASON: "Off season",
};

export const PROGRAM_FOCUS_AREA_LABELS: Record<ProgramFocusArea, string> = {
  hitting: "Hitting",
  fielding: "Fielding",
  speed: "Speed",
  strength: "Strength",
  mental: "Mental game",
};

export const PROGRAM_EQUIPMENT_LABELS: Record<ProgramEquipmentOption, string> = {
  cage_field: "Cage or field",
  tee_net: "Tee and net",
  glove_wall: "Glove and a wall",
  weights_gym: "Weights or gym",
  nothing_special: "Nothing special",
};

export const PROGRAM_STATUS_LABELS: Record<ProgramEnrollmentStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export function isProgramFocusArea(value: string): value is ProgramFocusArea {
  return PROGRAM_FOCUS_AREAS.includes(value as ProgramFocusArea);
}

export function isProgramEquipmentOption(value: string): value is ProgramEquipmentOption {
  return PROGRAM_EQUIPMENT_OPTIONS.includes(value as ProgramEquipmentOption);
}

export function normalizeFocusAreas(values: string[]) {
  const unique: ProgramFocusArea[] = [];
  for (const value of values) {
    if (!isProgramFocusArea(value)) {
      continue;
    }

    if (!unique.includes(value)) {
      unique.push(value);
    }
  }

  return unique.slice(0, 2);
}

export function normalizeEquipment(values: string[]) {
  const unique: ProgramEquipmentOption[] = [];
  for (const value of values) {
    if (!isProgramEquipmentOption(value)) {
      continue;
    }

    if (!unique.includes(value)) {
      unique.push(value);
    }
  }

  if (unique.includes("nothing_special")) {
    return ["nothing_special"];
  }

  return unique;
}
