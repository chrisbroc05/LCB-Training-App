/**
 * Coaching submission quota UI copy (client-safe).
 */

import type { ReviewAllowance } from "@/lib/access-shared";
import { formatDateWithYear } from "@/lib/format-date";
import { getCoachingSubmissionPeriodLabel, getNextCoachingSubmissionResetLabel } from "@/lib/coaching-submissions-shared";

export function formatReviewAllowanceDisplay(
  allowance: ReviewAllowance,
  options: {
    coreQuickReportNextEligibleAt?: Date | string | null;
    now?: Date;
  } = {},
): { headline: string; detail: string | null } {
  const now = options.now ?? new Date();

  if (allowance.kind === "unlimited") {
    return {
      headline: "Unlimited coaching submissions included with your program.",
      detail: null,
    };
  }

  if (allowance.kind === "in_depth_monthly") {
    const resetLabel = allowance.periodLabel
      ? getNextCoachingSubmissionResetLabel(now)
      : null;
    return {
      headline:
        allowance.remaining > 0
          ? "1 in-depth review per month"
          : "You have used your in-depth review for this month.",
      detail: resetLabel ? `Resets on ${resetLabel}.` : null,
    };
  }

  if (allowance.kind === "quick_six_weeks") {
    const nextEligible = options.coreQuickReportNextEligibleAt
      ? new Date(options.coreQuickReportNextEligibleAt)
      : null;
    const eligibleNow = allowance.canSubmit;
    if (allowance.periodLabel === "org trial") {
      return {
        headline: eligibleNow
          ? "Your swing report: 1 during org trial"
          : "You have used your org trial swing report.",
        detail: null,
      };
    }
    return {
      headline: eligibleNow
        ? "Your swing report: 1 every 6 weeks"
        : "Your next swing report is not available yet.",
      detail:
        !eligibleNow && nextEligible && !Number.isNaN(nextEligible.getTime())
          ? `Next eligible: ${formatDateWithYear(nextEligible)}.`
          : eligibleNow
            ? "Submit a swing video when you are ready for a quick written report."
            : null,
    };
  }

  if (allowance.kind === "playbook_lifetime") {
    return {
      headline:
        allowance.remaining > 0
          ? `${allowance.remaining} coaching submission${allowance.remaining === 1 ? "" : "s"} included with your Playbook purchase.`
          : "You have used your included Playbook coaching submission.",
      detail: null,
    };
  }

  if (allowance.kind === "free_once") {
    return {
      headline: allowance.canSubmit
        ? "1 free submission for new members"
        : "You have used your one free coaching submission.",
      detail: allowance.canSubmit
        ? "Use it for swing video or mindset support."
        : null,
    };
  }

  if (allowance.kind === "legacy_monthly") {
    return {
      headline: `${allowance.remaining} coaching submission${allowance.remaining === 1 ? "" : "s"} remaining for ${allowance.periodLabel ? getCoachingSubmissionPeriodLabel(allowance.periodLabel) : "this month"}.`,
      detail: null,
    };
  }

  return { headline: "Coaching submissions are not available on your plan.", detail: null };
}
