/**
 * Player evaluation PDF CTA box content (client-safe).
 */

import { formatDateWithYear } from "@/lib/format-date";
import { getFixItPlanByResourceSlug } from "@/lib/fix-it-plans-shared";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import type { QuickWrittenReportTrack } from "@/lib/quick-written-report-shared";

export type PlayerEvaluationCtaTrack = QuickWrittenReportTrack | "PLAYBOOK" | "PROGRAM" | "IN_DEPTH_MONTHLY";

export const REPORT_RECOMMENDED_FIX_IT_SLUGS = ["fixit-stay-closed", "fixit-hit-the-brakes"] as const;

export type ReportRecommendedFixItSlug = (typeof REPORT_RECOMMENDED_FIX_IT_SLUGS)[number];

export const REPORT_RECOMMENDED_FIX_IT_OPTIONS: {
  value: ReportRecommendedFixItSlug | "";
  label: string;
}[] = [
  { value: "", label: "None" },
  { value: "fixit-stay-closed", label: "Stay Closed" },
  { value: "fixit-hit-the-brakes", label: "Hit the Brakes" },
];

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

function buildRecommendedFixItOffer(
  slug: ReportRecommendedFixItSlug,
  membershipIncludesFixIt: boolean,
): PlayerEvaluationCtaOffer {
  const name = fixItShortName(slug);
  const body = membershipIncludesFixIt
    ? "A 3-week plan with my drill videos to fix this. Included with your membership."
    : "A 3-week plan with my drill videos to fix this. $19.";
  return {
    title: `Recommended for you: ${name}`,
    body,
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
  recommendedFixItSlug?: ReportRecommendedFixItSlug | null;
  membershipIncludesFixIt?: boolean;
  coreNextEligibleAt?: Date | null;
  orgTrialEndsAt?: Date | null;
}): PlayerEvaluationCtaContent {
  const firstName = params.firstName.trim() || "your player";
  const heading = `Keep building, ${firstName}`;
  const offers: PlayerEvaluationCtaOffer[] = [];
  const fixItSlug = params.recommendedFixItSlug ?? null;
  const membershipIncludesFixIt = Boolean(params.membershipIncludesFixIt);

  if (fixItSlug && REPORT_RECOMMENDED_FIX_IT_SLUGS.includes(fixItSlug)) {
    offers.push(buildRecommendedFixItOffer(fixItSlug, membershipIncludesFixIt));
  }

  if (params.reviewTrack === "FREE_ONCE") {
    offers.push({
      title: "12-Week Coaching Program",
      body: "A daily plan, weekly video breakdowns, and direct access to me.",
    });
    if (!fixItSlug) {
      offers.push({
        title: "Fix-It Hitting Plans",
        body: "3-week plans for the problems I see most. $19.",
      });
    }
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
      const endLabel = params.orgTrialEndsAt
        ? formatDateWithYear(params.orgTrialEndsAt)
        : "the end of your trial";
      offers.push({
        title: "Next report in 6 weeks",
        body: `Your trial runs through ${endLabel}.`,
      });
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
      // Copy stays neutral; no Plus / All-Access naming.
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
): { ok: true; slug: ReportRecommendedFixItSlug | null } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") {
    return { ok: true, slug: null };
  }
  const slug = String(value).trim();
  if (!(REPORT_RECOMMENDED_FIX_IT_SLUGS as readonly string[]).includes(slug)) {
    return { ok: false, error: "Invalid Fix-It plan selection." };
  }
  const plan = getFixItPlanByResourceSlug(slug);
  if (!plan) {
    return { ok: false, error: "Fix-It plan not found." };
  }
  return { ok: true, slug: slug as ReportRecommendedFixItSlug };
}
