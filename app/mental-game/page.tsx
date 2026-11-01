import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CoachingSubmissionUsageNotice, {
  buildReviewAllowanceFallbackCopy,
} from "@/app/components/CoachingSubmissionUsageNotice";
import { getReviewAllowance } from "@/lib/access-shared";
import CoachingMonthlyLimitPanel from "@/app/components/CoachingMonthlyLimitPanel";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import MentalGameForm from "@/app/mental-game/MentalGameForm";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
  formatMonthlyCoachingLimitMessage,
  getCoachingSubmissionLockReason,
} from "@/lib/coaching-submissions";
import { loadExtraReviewUiState } from "@/lib/extra-review-server";
import { mapExtraReviewUiState } from "@/lib/extra-review-ui-shared";
import { PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE } from "@/lib/coaching-submissions";
import { resolveEffectiveLevel } from "@/lib/access-shared";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import { getMentalSubmissionConfirmationVariant } from "@/lib/coaching-submission-confirmation-shared";
import { freeSubmissionUsedUpgradeMessage } from "@/lib/membership";
import { mergeOrgIntoAccessFields, userOrgAccessSelect } from "@/lib/org-server";
import { prisma } from "@/lib/prisma";
import {
  canSubmitMindsetCoachingRequest,
  resolveAutoMindsetPoolId,
} from "@/lib/coaching-submission-pool-shared";

export default async function MentalGamePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const userFields = await ensureCoachingSubmissionPeriod(session.user.id);
  if (!userFields) {
    redirect("/auth");
  }

  const lockReason = getCoachingSubmissionLockReason(userFields);
  const availability = getCoachingSubmissionAvailability(userFields);
  const effective = resolveEffectiveLevel(userFields);

  if (lockReason === "playbook-used" && effective === "PLAYBOOK") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit what you are dealing with mentally so your coach can send support and adjustments."
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
        description="Submit what you are dealing with mentally so your coach can send support and adjustments."
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
  const allowanceBuildOptions = {
    unusedExtraReviewCredits,
  };

  if (lockReason === "monthly-limit") {
    if (!canSubmitMindsetCoachingRequest(userFields, new Date(), allowanceBuildOptions)) {
      return (
        <CoachingMonthlyLimitPanel
          title="Coaching Submissions"
          description="Submit what you are dealing with mentally so your coach can send support and adjustments."
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
  }

  if (!canSubmitMindsetCoachingRequest(userFields, new Date(), allowanceBuildOptions)) {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description="Submit what you are dealing with mentally so your coach can send support and adjustments."
        message={PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE}
        upgradeLabel="View the 12-Week Program"
        upgradeHref="/program"
      />
    );
  }

  const accessUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      membershipTier: true,
      membershipLevel: true,
      membershipLevelExpiresAt: true,
      playbookLegacyAccess: true,
      ...userOrgAccessSelect,
    },
  });
  const effectiveLevel = accessUser
    ? resolveEffectiveLevel(mergeOrgIntoAccessFields(accessUser))
    : "FREE";
  const confirmationVariant = getMentalSubmissionConfirmationVariant(effectiveLevel);
  const mindsetPoolId = resolveAutoMindsetPoolId(userFields, new Date(), allowanceBuildOptions);
  const quotaFallbackCopy = buildReviewAllowanceFallbackCopy(getReviewAllowance(userFields), {
    coreQuickReportNextEligibleAt: userFields.coreQuickReportNextEligibleAt,
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Coaching Submissions
        </h1>
        <p className="mt-2 text-zinc-300">
          Submit what you are dealing with mentally so your coach can send support and adjustments.
        </p>

        <CoachingSubmissionUsageNotice
          poolId={mindsetPoolId}
          coachingSubmissionPeriod={userFields.coachingSubmissionPeriod}
          extraReviewUseByIso={
            extraReviewState?.nextCreditExpiresAt?.toISOString() ?? null
          }
          fallbackCopy={quotaFallbackCopy}
        />
        <MentalGameForm confirmationVariant={confirmationVariant} />
      </section>
    </div>
  );
}
