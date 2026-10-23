/**
 * Profile coaching response upsells and goal check-in visibility (client-safe).
 */

import type { EffectiveAccessLevel } from "@/lib/access-shared";

export type ProfileResponseUpsellVariant = "FREE" | "CORE_ORG_NEUTRAL" | "NONE";

export function getProfileResponseUpsellVariant(
  level: EffectiveAccessLevel,
): ProfileResponseUpsellVariant {
  if (level === "FREE") {
    return "FREE";
  }
  if (level === "CORE" || level === "ORG_TRIAL") {
    return "CORE_ORG_NEUTRAL";
  }
  return "NONE";
}

export function shouldShowProfileGoalCheckinHistory(level: EffectiveAccessLevel): boolean {
  return level === "TWELVE_WEEK";
}
