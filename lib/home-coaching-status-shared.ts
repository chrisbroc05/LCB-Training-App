/**
 * Home "Coaching Submissions" status copy by membership level (client-safe).
 */

import {
  getReviewAllowance,
  resolveEffectiveLevel,
  type AccessUserFields,
} from "@/lib/access-shared";
import { formatDateWithYear } from "@/lib/format-date";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import type { CoachingSubmissionUserFields } from "@/lib/coaching-submissions-shared";
import { getNextCoachingSubmissionResetLabel } from "@/lib/coaching-submissions-shared";

export type HomeCoachingStatus = {
  headline: string;
  detail: string | null;
  primaryHref: string | null;
  primaryLabel: string | null;
  secondaryHref: string | null;
  secondaryLabel: string | null;
  canSubmit: boolean;
  showTwelveWeekPitch: false;
};

export type OrgTrialReportContext = {
  usedAt: Date | string | null;
  viewHref: string | null;
};

export function getHomeCoachingStatus(params: {
  user: AccessUserFields & CoachingSubmissionUserFields;
  orgTrialReport?: OrgTrialReportContext | null;
  now?: Date;
}): HomeCoachingStatus {
  const now = params.now ?? new Date();
  const user = params.user;
  const effective = resolveEffectiveLevel(user, now);
  const allowance = getReviewAllowance(user, now);
  const membershipHref = isPublicMembershipLevelsEnabled() ? "/upgrade" : "/program";
  const membershipLabel = isPublicMembershipLevelsEnabled()
    ? "See membership levels"
    : "See the 12-Week Program";

  if (effective === "ORG_TRIAL") {
    if (allowance.canSubmit) {
      return {
        headline: "You have 1 free swing report.",
        detail: "Send your swing for a written report from Coach Broc.",
        primaryHref: "/coaching-submissions",
        primaryLabel: "Send your swing",
        secondaryHref: null,
        secondaryLabel: null,
        canSubmit: true,
        showTwelveWeekPitch: false,
      };
    }

    const usedLabel = params.orgTrialReport?.usedAt
      ? formatDateWithYear(params.orgTrialReport.usedAt)
      : null;
    return {
      headline: usedLabel
        ? `Your swing report: used ${usedLabel}.`
        : "Your swing report: used.",
      detail: "Want more feedback from Coach Broc? Memberships include more swing reports.",
      primaryHref: params.orgTrialReport?.viewHref ?? "/profile",
      primaryLabel: "View report",
      secondaryHref: membershipHref,
      secondaryLabel: membershipLabel,
      canSubmit: false,
      showTwelveWeekPitch: false,
    };
  }

  if (effective === "CORE") {
    const nextEligible = user.coreQuickReportNextEligibleAt
      ? new Date(user.coreQuickReportNextEligibleAt)
      : null;
    if (allowance.canSubmit) {
      return {
        headline: "Your swing report is available.",
        detail: "Core includes 1 written swing report every 6 weeks.",
        primaryHref: "/coaching-submissions",
        primaryLabel: "Send your swing",
        secondaryHref: null,
        secondaryLabel: null,
        canSubmit: true,
        showTwelveWeekPitch: false,
      };
    }
    return {
      headline: "Your next swing report is not available yet.",
      detail:
        nextEligible && !Number.isNaN(nextEligible.getTime())
          ? `Next available ${formatDateWithYear(nextEligible)}.`
          : "Core includes 1 written swing report every 6 weeks.",
      primaryHref: "/profile",
      primaryLabel: "My Swing Reports",
      secondaryHref: null,
      secondaryLabel: null,
      canSubmit: false,
      showTwelveWeekPitch: false,
    };
  }

  if (effective === "PLUS") {
    if (allowance.remaining > 0) {
      return {
        headline: "1 in-depth review left this month.",
        detail: "Plus includes 1 in-depth video review per month.",
        primaryHref: "/coaching-submissions",
        primaryLabel: "Send your swing",
        secondaryHref: null,
        secondaryLabel: null,
        canSubmit: true,
        showTwelveWeekPitch: false,
      };
    }
    return {
      headline: "You have used this month's in-depth review.",
      detail: `Next review available ${getNextCoachingSubmissionResetLabel(now)}.`,
      primaryHref: "/profile",
      primaryLabel: "My Swing Reports",
      secondaryHref: null,
      secondaryLabel: null,
      canSubmit: false,
      showTwelveWeekPitch: false,
    };
  }

  if (effective === "ALL_ACCESS" || effective === "TWELVE_WEEK") {
    return {
      headline: "Coaching submissions are included with your plan.",
      detail: "Send a swing anytime for feedback from Coach Broc.",
      primaryHref: "/coaching-submissions",
      primaryLabel: "Send your swing",
      secondaryHref: null,
      secondaryLabel: null,
      canSubmit: true,
      showTwelveWeekPitch: false,
    };
  }

  if (effective === "FREE") {
    if (allowance.canSubmit) {
      return {
        headline: "You have 1 free swing report.",
        detail: "Send your swing for a written report from Coach Broc.",
        primaryHref: "/coaching-submissions",
        primaryLabel: "Send your swing",
        secondaryHref: null,
        secondaryLabel: null,
        canSubmit: true,
        showTwelveWeekPitch: false,
      };
    }
    return {
      headline: "You have used your free swing report.",
      detail: "Want more feedback from Coach Broc? Memberships include more swing reports.",
      primaryHref: membershipHref,
      primaryLabel: membershipLabel,
      secondaryHref: "/profile",
      secondaryLabel: "View report",
      canSubmit: false,
      showTwelveWeekPitch: false,
    };
  }

  if (allowance.canSubmit) {
    return {
      headline:
        allowance.remaining > 0
          ? `${allowance.remaining} coaching submission${allowance.remaining === 1 ? "" : "s"} left.`
          : "A coaching submission is available.",
      detail: null,
      primaryHref: "/coaching-submissions",
      primaryLabel: "Go to Coaching Submissions",
      secondaryHref: null,
      secondaryLabel: null,
      canSubmit: true,
      showTwelveWeekPitch: false,
    };
  }

  return {
    headline: "No coaching submissions available right now.",
    detail: null,
    primaryHref: "/profile",
    primaryLabel: "My Swing Reports",
    secondaryHref: membershipHref,
    secondaryLabel: membershipLabel,
    canSubmit: false,
    showTwelveWeekPitch: false,
  };
}
