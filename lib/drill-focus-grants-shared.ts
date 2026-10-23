/**
 * Temporary drill access from org weekly focus and coach 2-week review focus (client-safe).
 */

import { getWeekStartMondayChicago, weekStartDatesMatch } from "@/lib/org-weekly-focus-shared";

export type CoachFocusSubmissionRow = {
  recommendedDrills: readonly string[];
  coachFocusPreset: string | null;
  coachFocusEndsAt: Date | string | null;
};

export type PermanentSubmissionRow = {
  recommendedDrills: readonly string[];
  coachFocusPreset?: string | null;
};

export function collectCoachFocusTemporaryDrillIds(
  submissions: readonly CoachFocusSubmissionRow[],
  now = new Date(),
): string[] {
  const ids = new Set<string>();
  const nowMs = now.getTime();

  for (const submission of submissions) {
    if (!submission.coachFocusPreset?.trim()) {
      continue;
    }
    const endsAt =
      submission.coachFocusEndsAt instanceof Date
        ? submission.coachFocusEndsAt
        : submission.coachFocusEndsAt
          ? new Date(submission.coachFocusEndsAt)
          : null;
    if (!endsAt || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= nowMs) {
      continue;
    }
    for (const drillId of submission.recommendedDrills) {
      const trimmed = drillId.trim();
      if (trimmed) {
        ids.add(trimmed);
      }
    }
  }

  return [...ids];
}

export function collectPermanentRecommendedDrillIds(
  swingSubmissions: readonly PermanentSubmissionRow[],
  mentalSubmissions: readonly PermanentSubmissionRow[],
): string[] {
  const ids = new Set<string>();

  for (const submission of swingSubmissions) {
    if (submission.coachFocusPreset?.trim()) {
      continue;
    }
    for (const drillId of submission.recommendedDrills) {
      const trimmed = drillId.trim();
      if (trimmed) {
        ids.add(trimmed);
      }
    }
  }

  for (const submission of mentalSubmissions) {
    for (const drillId of submission.recommendedDrills) {
      const trimmed = drillId.trim();
      if (trimmed) {
        ids.add(trimmed);
      }
    }
  }

  return [...ids];
}

export function mergeUniqueDrillIds(...groups: readonly (readonly string[])[]): string[] {
  const ids = new Set<string>();
  for (const group of groups) {
    for (const drillId of group) {
      const trimmed = drillId.trim();
      if (trimmed) {
        ids.add(trimmed);
      }
    }
  }
  return [...ids];
}

export function isOrgWeeklyFocusDrillActiveForWeek(
  focusWeekStart: Date | string,
  now = new Date(),
): boolean {
  return weekStartDatesMatch(focusWeekStart, getWeekStartMondayChicago(now));
}
