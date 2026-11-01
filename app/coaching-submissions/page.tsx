import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CoachingSubmissionsHub from "@/app/coaching-submissions/CoachingSubmissionsHub";
import FreeSwingWelcomeBanner from "@/app/coaching-submissions/FreeSwingWelcomeBanner";
import CoachingMonthlyLimitPanel from "@/app/components/CoachingMonthlyLimitPanel";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
  getCoachingSubmissionLockReason,
  formatMonthlyCoachingLimitMessage,
} from "@/lib/coaching-submissions";
import {
  confirmExtraReviewCheckoutSession,
  loadExtraReviewUiState,
} from "@/lib/extra-review-server";
import { mapExtraReviewUiState } from "@/lib/extra-review-ui-shared";
import { PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE } from "@/lib/coaching-submissions";
import {
  canAccessCoachingNav,
  getCoachingResponseTimeLabel,
  freeSubmissionUsedUpgradeMessage,
} from "@/lib/membership";
import { listCoachingAllowanceSummaryOptions } from "@/lib/coaching-submission-pool-shared";
import { resolveEffectiveLevel } from "@/lib/access-shared";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";

type CoachingSubmissionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CoachingSubmissionsPage({
  searchParams,
}: CoachingSubmissionsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const checkoutSessionId =
    typeof resolvedSearchParams.session_id === "string"
      ? resolvedSearchParams.session_id.trim()
      : "";
  if (resolvedSearchParams.extraReview === "purchased" && checkoutSessionId) {
    await confirmExtraReviewCheckoutSession({
      userId: session.user.id,
      stripeCheckoutSessionId: checkoutSessionId,
    });
  }

  const userFields = await ensureCoachingSubmissionPeriod(session.user.id);
  if (!userFields) {
    redirect("/auth");
  }

  const membershipTier = userFields.membershipTier;
  const availability = getCoachingSubmissionAvailability(userFields);
  const lockReason = getCoachingSubmissionLockReason(userFields);
  const effective = resolveEffectiveLevel(userFields);

  if (lockReason === "playbook-used" && effective === "PLAYBOOK") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
        message={PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE}
        upgradeLabel="View the 12-Week Program"
        upgradeHref="/program"
      />
    );
  }

  if (lockReason === "free-used") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
        message={freeSubmissionUsedUpgradeMessage}
        upgradeLabel="Join the 12-Week Program"
        upgradeHref="/program"
      />
    );
  }

  const membershipLevelsLive = isPublicMembershipLevelsEnabled();
  const extraReviewState =
    membershipLevelsLive && effective === "PLUS"
      ? await loadExtraReviewUiState(session.user.id)
      : null;
  const extraReviewUi = extraReviewState ? mapExtraReviewUiState(extraReviewState) : null;
  const unusedExtraReviewCredits = extraReviewState?.unusedCredits ?? 0;
  const hasSubmittableExtraReview = unusedExtraReviewCredits > 0;

  if (lockReason === "monthly-limit" && !hasSubmittableExtraReview) {
    return (
      <CoachingMonthlyLimitPanel
        title="Coaching Submissions"
        description="Submit swing videos and mindset questions for personalized feedback from Coach Broc."
        message={formatMonthlyCoachingLimitMessage()}
        showExtraReviewOffer={
          membershipLevelsLive && effective === "PLUS" && unusedExtraReviewCredits === 0
        }
        extraReview={extraReviewUi}
        upgradeLabel="View Membership"
        upgradeHref="/settings"
      />
    );
  }

  const summaryOptions = listCoachingAllowanceSummaryOptions(userFields, new Date(), {
    unusedExtraReviewCredits,
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <FreeSwingWelcomeBanner />
      <CoachingSubmissionsHub
        summaryOptions={summaryOptions}
        responseTimeLabel={getCoachingResponseTimeLabel(membershipTier)}
        showHistoryLink={canAccessCoachingNav(membershipTier) || membershipTier === "BASIC"}
        extraReview={membershipLevelsLive && effective === "PLUS" ? extraReviewUi : null}
        monthlyReviewUsed={lockReason === "monthly-limit"}
      />
    </div>
  );
}
