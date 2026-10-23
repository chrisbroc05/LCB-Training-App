/**
 * Org trial dashboard card visibility (client-safe, America/Chicago).
 */

import { readChicagoCalendarYmd } from "@/lib/org-trial-dates-shared";

export const ORG_TRIAL_COUNTDOWN_WINDOW_DAYS = 14;

export const ORG_TRIAL_WHATS_NEXT_LINE =
  "When your trial ends, your club will share next steps for continuing access. More details coming soon.";

function calendarDayNumber(year: number, month: number, day: number) {
  return Math.floor(Date.UTC(year, month - 1, day) / (24 * 60 * 60 * 1000));
}

/** Whole calendar days from Chicago today until trial end date (0 = ends today). */
export function getOrgTrialDaysRemainingChicago(
  trialEndsAt: Date | string | null | undefined,
  now = new Date(),
): number | null {
  if (!trialEndsAt) {
    return null;
  }
  const end = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) {
    return null;
  }
  const today = readChicagoCalendarYmd(now);
  const endDay = readChicagoCalendarYmd(end);
  return calendarDayNumber(endDay.year, endDay.month, endDay.day) -
    calendarDayNumber(today.year, today.month, today.day);
}

export function isOrgTrialFinalFortnight(
  trialEndsAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  const daysRemaining = getOrgTrialDaysRemainingChicago(trialEndsAt, now);
  if (daysRemaining === null) {
    return false;
  }
  return daysRemaining >= 0 && daysRemaining <= ORG_TRIAL_COUNTDOWN_WINDOW_DAYS;
}

export type OrgTrialDashboardCardMode = "standard" | "countdown";

export function resolveOrgTrialDashboardCardVisibility(params: {
  dismissedAt: Date | string | null | undefined;
  trialEndsAt: Date | string | null | undefined;
  now?: Date;
}): { show: boolean; mode: OrgTrialDashboardCardMode } {
  const now = params.now ?? new Date();
  const daysRemaining = getOrgTrialDaysRemainingChicago(params.trialEndsAt, now);
  if (daysRemaining !== null && daysRemaining < 0) {
    return { show: false, mode: "standard" };
  }

  if (isOrgTrialFinalFortnight(params.trialEndsAt, now)) {
    return { show: true, mode: "countdown" };
  }

  if (params.dismissedAt) {
    return { show: false, mode: "standard" };
  }

  return { show: true, mode: "standard" };
}

export function formatOrgTrialCountdownLabel(
  trialEndsAt: Date | string | null | undefined,
  now = new Date(),
): string | null {
  const daysRemaining = getOrgTrialDaysRemainingChicago(trialEndsAt, now);
  if (daysRemaining === null || daysRemaining < 0) {
    return null;
  }
  if (daysRemaining === 0) {
    return "Your trial ends today";
  }
  if (daysRemaining === 1) {
    return "Your trial ends in 1 day";
  }
  return `Your trial ends in ${daysRemaining} days`;
}
