/**
 * Post-submit coaching confirmation copy by effective access (client-safe).
 */

import type { EffectiveAccessLevel } from "@/lib/access-shared";
import type { FreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-shared";

export const COACH_RESPONSE_WITHIN_FEW_DAYS_LABEL = "within a few days";

export type SwingSubmissionConfirmationVariant = "FREE" | "WRITTEN_REPORT" | "PREMIUM_VIDEO";

export type SwingResponsePreferenceValue = "VIDEO_RESPONSE" | "WRITTEN_RESPONSE";

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
  return level === "CORE" || level === "ORG_TRIAL" || level === "FREE";
}

/**
 * Levels that hide the preference chooser also force a response type.
 * Free follows the admin free-swing mode (VIDEO by default = in-depth video breakdown).
 */
export function getForcedSwingResponsePreference(
  level: EffectiveAccessLevel,
  freeSwingMode: FreeSwingAnalysisResponseMode = "VIDEO",
): SwingResponsePreferenceValue | null {
  if (level === "CORE" || level === "ORG_TRIAL") {
    return "WRITTEN_RESPONSE";
  }
  if (level === "FREE") {
    return freeSwingMode === "WRITTEN_REPORT" ? "WRITTEN_RESPONSE" : "VIDEO_RESPONSE";
  }
  return null;
}

export function getMentalSubmissionConfirmationVariant(
  level: EffectiveAccessLevel,
): "FREE" | "PREMIUM_VIDEO" {
  if (level === "FREE") {
    return "FREE";
  }
  return "PREMIUM_VIDEO";
}
