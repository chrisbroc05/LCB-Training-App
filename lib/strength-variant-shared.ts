import type { ProgramEquipmentOption } from "@/lib/program-enrollment-shared";

export const STRENGTH_VARIANTS = ["gym", "bodyweight", "home_weights"] as const;

export type StrengthVariant = (typeof STRENGTH_VARIANTS)[number];

export const STRENGTH_VARIANT_LABELS: Record<StrengthVariant, string> = {
  gym: "Gym",
  bodyweight: "Bodyweight",
  home_weights: "Home weights",
};

export function isStrengthVariant(value: string): value is StrengthVariant {
  return STRENGTH_VARIANTS.includes(value as StrengthVariant);
}

export function deriveStrengthVariantFromEquipment(
  equipment: ProgramEquipmentOption[],
): StrengthVariant {
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
}): StrengthVariant {
  if (params.strengthVariant && isStrengthVariant(params.strengthVariant)) {
    return params.strengthVariant;
  }

  return deriveStrengthVariantFromEquipment(params.equipment);
}
