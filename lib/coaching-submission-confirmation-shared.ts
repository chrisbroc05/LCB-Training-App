/**
 * Post-submit coaching confirmation copy by effective access (client-safe).
 */

import type { EffectiveAccessLevel } from "@/lib/access-shared";

export const COACH_RESPONSE_WITHIN_FEW_DAYS_LABEL = "within a few days";

export type SwingSubmissionConfirmationVariant = "FREE" | "WRITTEN_REPORT" | "PREMIUM_VIDEO";

export function getSwingSubmissionConfirmationVariant(
  level: EffectiveAccessLevel,
): SwingSubmissionConfirmationVariant {
  if (level === "FREE") {
    return "FREE";
  }
  if (level === "CORE" || level === "ORG_TRIAL") {
    return "WRITTEN_REPORT";
  }
  return "PREMIUM_VIDEO";
}

export function shouldHideSwingResponsePreference(level: EffectiveAccessLevel) {
  return level === "CORE" || level === "ORG_TRIAL";
}

export function getMentalSubmissionConfirmationVariant(
  level: EffectiveAccessLevel,
): "FREE" | "PREMIUM_VIDEO" {
  if (level === "FREE") {
    return "FREE";
  }
  return "PREMIUM_VIDEO";
}
