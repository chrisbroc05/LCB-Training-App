import type {
  ProgramAgeGroup,
  ProgramEquipmentOption,
} from "@/lib/program-enrollment-shared";

export const STRENGTH_VARIANTS = ["gym", "bodyweight", "home_weights"] as const;

export type StrengthVariant = (typeof STRENGTH_VARIANTS)[number];

export const STRENGTH_VARIANT_LABELS: Record<StrengthVariant, string> = {
  gym: "Gym",
  bodyweight: "Bodyweight",
  home_weights: "Home weights",
};

/** Shown instead of gym / bodyweight / home weights for ages 8-11 (one PDF program). */
export const AGE_8_11_STRENGTH_PROGRAM_LABEL = "One strength program (minimal equipment)";

export const AGE_8_11_STRENGTH_PROGRAM_NOTE =
  "Bodyweight moves, a sturdy step or box when listed, and an optional light band on some weeks. There is not a separate bodyweight or home-weights track for this age.";

export function isStrengthVariant(value: string): value is StrengthVariant {
  return STRENGTH_VARIANTS.includes(value as StrengthVariant);
}

export function deriveStrengthVariantFromEquipment(
  equipment: ProgramEquipmentOption[],
  ageGroup?: ProgramAgeGroup | null,
): StrengthVariant {
  if (ageGroup === "AGE_8_11") {
    return "gym";
  }

  if (equipment.includes("weights_gym")) {
    return "gym";
  }

  if (equipment.includes("home_weights")) {
    return "home_weights";
  }

  return "bodyweight";
}

export function resolveStrengthVariant(params: {
  strengthVariant: StrengthVariant | null | undefined;
  equipment: ProgramEquipmentOption[];
  ageGroup?: ProgramAgeGroup | null;
}): StrengthVariant {
  if (params.ageGroup === "AGE_8_11") {
    return "gym";
  }

  if (params.strengthVariant && isStrengthVariant(params.strengthVariant)) {
    return params.strengthVariant;
  }

  return deriveStrengthVariantFromEquipment(params.equipment, params.ageGroup);
}

export function strengthVariantLabelForEnrollment(params: {
  ageGroup: ProgramAgeGroup | null | undefined;
  strengthVariant: StrengthVariant;
}) {
  if (params.ageGroup === "AGE_8_11") {
    return AGE_8_11_STRENGTH_PROGRAM_LABEL;
  }

  return STRENGTH_VARIANT_LABELS[params.strengthVariant];
}
