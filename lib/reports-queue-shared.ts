/**
 * Which review tracks use the admin Reports queue vs Submissions inbox (client-safe).
 */

import type { CoachingReviewTrack } from "@prisma/client";
import type { FreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-shared";
import { DEFAULT_FREE_SWING_ANALYSIS_RESPONSE_MODE } from "@/lib/free-swing-analysis-response-shared";

export const REPORTS_QUEUE_CORE_TRACKS = ["QUICK_SIX_WEEK", "ORG_TRIAL_QUICK"] as const satisfies readonly CoachingReviewTrack[];

export function getReportsQueueReviewTracks(
  freeSwingMode: FreeSwingAnalysisResponseMode = DEFAULT_FREE_SWING_ANALYSIS_RESPONSE_MODE,
): CoachingReviewTrack[] {
  if (freeSwingMode === "WRITTEN_REPORT") {
    return [...REPORTS_QUEUE_CORE_TRACKS, "FREE_ONCE"];
  }
  return [...REPORTS_QUEUE_CORE_TRACKS];
}

export function isReportsQueueReviewTrack(
  reviewTrack: string | null | undefined,
  freeSwingMode: FreeSwingAnalysisResponseMode = DEFAULT_FREE_SWING_ANALYSIS_RESPONSE_MODE,
): boolean {
  if (!reviewTrack) {
    return false;
  }
  return (getReportsQueueReviewTracks(freeSwingMode) as readonly string[]).includes(reviewTrack);
}
