/**
 * Player evaluation PDF CTA box content (client-safe).
 */

import { formatDateWithYear } from "@/lib/format-date";
import {
  isFoundingOfferWindowOpen,
  type FoundingOfferOrgFields,
} from "@/lib/founding-offer-shared";
import { getFixItPlanByResourceSlug } from "@/lib/fix-it-plans-shared";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import { formatChicagoMonthDayLabel } from "@/lib/org-trial-dates-shared";
import type { QuickWrittenReportTrack } from "@/lib/quick-written-report-shared";

export type PlayerEvaluationCtaTrack = QuickWrittenReportTrack | "PLAYBOOK" | "PROGRAM" | "IN_DEPTH_MONTHLY";

export const REPORT_RECOMMENDED_FIX_IT_SLUGS = ["fixit-stay-closed", "fixit-hit-the-brakes"] as const;

export type ReportRecommendedFixItSlug = (typeof REPORT_RECOMMENDED_FIX_IT_SLUGS)[number];

export const REPORT_RECOMMENDED_PLAYBOOK_SLUG = "playbook" as const;

export type ReportRecommendedProductSlug =
  | ReportRecommendedFixItSlug
  | typeof REPORT_RECOMMENDED_PLAYBOOK_SLUG;

/** @deprecated Prefer ReportRecommendedProductSlug. */
export type ReportRecommendedSlug = ReportRecommendedProductSlug;

export const REPORT_RECOMMENDED_PRODUCT_OPTIONS: {
  value: ReportRecommendedProductSlug | "";
  label: string;
}[] = [
  { value: "", label: "None" },
  { value: "fixit-stay-closed", label: "Stay Closed" },
  { value: "fixit-hit-the-brakes", label: "Hit the Brakes" },
  { value: "playbook", label: "Playbook" },
];

/** @deprecated Prefer REPORT_RECOMMENDED_PRODUCT_OPTIONS. */
export const REPORT_RECOMMENDED_FIX_IT_OPTIONS = REPORT_RECOMMENDED_PRODUCT_OPTIONS;

export type PlayerEvaluationCtaOffer = {
  title: string;
  body: string;
};

export type PlayerEvaluationCtaContent = {
  heading: string;
  offers: PlayerEvaluationCtaOffer[];
  urlLabel: string;
};

export const CORE_QUICK_REPORT_INTERVAL_MS = 6 * 7 * 24 * 60 * 60 * 1000;

function fixItShortName(slug: ReportRecommendedFixItSlug) {
  if (slug === "fixit-stay-closed") {
    return "Stay Closed";
  }
  return "Hit the Brakes";
}

function isFixItProductSlug(slug: string): slug is ReportRecommendedFixItSlug {
  return (REPORT_RECOMMENDED_FIX_IT_SLUGS as readonly string[]).includes(slug);
}

function buildRecommendedProductOffer(
  slug: ReportRecommendedProductSlug,
  membershipIncludesFixIt: boolean,
): PlayerEvaluationCtaOffer {
  if (slug === REPORT_RECOMMENDED_PLAYBOOK_SLUG) {
    return {
      title: "Recommended for you: The Next Level Playbook",
      body: "My interactive guide to the mental side of the game and how to train with purpose.",
    };
  }

  const name = fixItShortName(slug);
  const body = membershipIncludesFixIt
    ? "A 3-week plan with my drill videos to fix this. Included with your membership."
    : "A 3-week plan with my drill videos to fix this. $19.";
  return {
    title: `Recommended for you: ${name}`,
    body,
  };
}

function buildOrgTrialNextReportOffer(params: {
  orgName: string | null | undefined;
  founding: FoundingOfferOrgFields | null | undefined;
  now?: Date;
}): PlayerEvaluationCtaOffer {
  const title = "Want your next report?";
  const founding = params.founding ?? null;
  if (!founding || !isFoundingOfferWindowOpen(founding, params.now) || !founding.foundingOfferDeadline) {
    return {
      title,
      body: "Keep going with a membership.",
    };
  }

  const deadlineLabel = formatChicagoMonthDayLabel(founding.foundingOfferDeadline);
  if (!deadlineLabel) {
    return {
      title,
      body: "Keep going with a membership.",
    };
  }

  const orgLabel = params.orgName?.trim() || "Your club";
  return {
    title,
    body: `Keep going with a membership. ${orgLabel} families get Plus for $15/month (normally $20) when they join by ${deadlineLabel}.`,
  };
}

function isPremiumCoachingTrack(reviewTrack: PlayerEvaluationCtaTrack) {
  return (
    reviewTrack === "IN_DEPTH_MONTHLY" ||
    reviewTrack === "PROGRAM" ||
    reviewTrack === "PLAYBOOK"
  );
}

export function buildPlayerEvaluationCtaContent(params: {
  firstName: string;
  reviewTrack: PlayerEvaluationCtaTrack;
  recommendedFixItSlug?: ReportRecommendedProductSlug | null;
  membershipIncludesFixIt?: boolean;
  coreNextEligibleAt?: Date | null;
  orgTrialEndsAt?: Date | null;
  orgName?: string | null;
  founding?: FoundingOfferOrgFields | null;
  now?: Date;
}): PlayerEvaluationCtaContent {
  const firstName = params.firstName.trim() || "your player";
  const heading = `Keep building, ${firstName}`;
  const offers: PlayerEvaluationCtaOffer[] = [];
  const productSlug = params.recommendedFixItSlug ?? null;
  const membershipIncludesFixIt = Boolean(params.membershipIncludesFixIt);

  if (productSlug) {
    offers.push(buildRecommendedProductOffer(productSlug, membershipIncludesFixIt));
  }

  if (params.reviewTrack === "FREE_ONCE") {
    offers.push({
      title: "12-Week Coaching Program",
      body: "A daily plan, weekly video breakdowns, and direct access to me.",
    });
    offers.push({
      title: "Free guides + Player IQ Quiz",
      body: "Warm-up, arm care, nutrition, and more.",
    });
    return {
      heading,
      offers: offers.slice(0, 3),
      urlLabel: "lcbtraining.com/resources",
    };
  }

  if (params.reviewTrack === "QUICK_SIX_WEEK" || params.reviewTrack === "ORG_TRIAL_QUICK") {
    offers.push({
      title: "Work your drills",
      body: "Your drills are in the app. Reps every day.",
    });

    if (params.reviewTrack === "ORG_TRIAL_QUICK") {
      offers.push(
        buildOrgTrialNextReportOffer({
          orgName: params.orgName,
          founding: params.founding,
          now: params.now,
        }),
      );
    } else {
      const nextLabel = params.coreNextEligibleAt
        ? formatDateWithYear(params.coreNextEligibleAt)
        : "your next eligible date";
      offers.push({
        title: "Next report in 6 weeks",
        body: `Send your next swing on ${nextLabel} so I can see your progress.`,
      });
    }

    offers.push({
      title: "Free guides + Player IQ Quiz",
      body: "Warm-up, arm care, nutrition, and more.",
    });

    if (!isPublicMembershipLevelsEnabled()) {
      // Copy stays neutral; no Plus / All-Access naming outside founding org-trial line.
    }

    return {
      heading,
      offers: offers.slice(0, 3),
      urlLabel: "lcbtraining.com/resources",
    };
  }

  if (isPremiumCoachingTrack(params.reviewTrack)) {
    offers.push({
      title: "Work your drills",
      body: "Your drills are in the app.",
    });
    offers.push({
      title: "Send your next video",
      body: "Your next in-depth review is ready when you are.",
    });
    offers.push({
      title: "Message me anytime",
      body: "Questions go straight to me in the app.",
    });
    return {
      heading,
      offers: offers.slice(0, 3),
      urlLabel: "lcbtraining.com",
    };
  }

  return {
    heading,
    offers: offers.slice(0, 3),
    urlLabel: "lcbtraining.com",
  };
}

export function parseReportRecommendedFixItSlug(
  value: unknown,
): { ok: true; slug: ReportRecommendedProductSlug | null } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") {
    return { ok: true, slug: null };
  }
  const slug = String(value).trim();
  if (slug === REPORT_RECOMMENDED_PLAYBOOK_SLUG) {
    return { ok: true, slug: REPORT_RECOMMENDED_PLAYBOOK_SLUG };
  }
  if (!isFixItProductSlug(slug)) {
    return { ok: false, error: "Invalid recommendation selection." };
  }
  const plan = getFixItPlanByResourceSlug(slug);
  if (!plan) {
    return { ok: false, error: "Fix-It plan not found." };
  }
  return { ok: true, slug };
}

export function recommendedProductSlugToLabel(slug: string | null | undefined): string | null {
  if (!slug) {
    return null;
  }
  const match = REPORT_RECOMMENDED_PRODUCT_OPTIONS.find((option) => option.value === slug);
  return match?.label ?? slug;
}
