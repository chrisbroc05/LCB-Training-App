import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildReviewAllowanceFallbackCopy } from "@/app/components/CoachingSubmissionUsageNotice";
import CoachingMonthlyLimitPanel from "@/app/components/CoachingMonthlyLimitPanel";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import SwingAnalysisForm from "@/app/swing-analysis/SwingAnalysisForm";
import { getReviewAllowance, resolveEffectiveLevel } from "@/lib/access-shared";
import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import { SWING_COACHING_FORM_INTRO } from "@/lib/coaching-submission-display-shared";
import {
  ensureCoachingSubmissionPeriod,
  formatMonthlyCoachingLimitMessage,
  getCoachingSubmissionAvailabilityForUser,
} from "@/lib/coaching-submissions";
import { loadExtraReviewUiState } from "@/lib/extra-review-server";
import { mapExtraReviewUiState } from "@/lib/extra-review-ui-shared";
import { PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE } from "@/lib/coaching-submissions";
import {
  getSwingSubmissionConfirmationVariant,
  shouldHideSwingResponsePreference,
} from "@/lib/coaching-submission-confirmation-shared";
import { freeSubmissionUsedUpgradeMessage } from "@/lib/membership";
import { mergeOrgIntoAccessFields, userOrgAccessSelect } from "@/lib/org-server";
import { loadCurrentOrgWeeklyFocusForUser } from "@/lib/org-weekly-focus-server";
import { prisma } from "@/lib/prisma";
import { loadKeepBuildingCoachingContextForUser } from "@/lib/coaching-keep-building-server";
import KeepBuildingSwingCard from "@/app/components/KeepBuildingSwingCard";
import {
  listSwingCoachingAllowanceFormOptions,
  requiresSwingAllowanceFormChoice,
} from "@/lib/coaching-submission-pool-shared";

export default async function SwingAnalysisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const userFields = await ensureCoachingSubmissionPeriod(session.user.id);
  if (!userFields) {
    redirect("/auth");
  }

  const availability = await getCoachingSubmissionAvailabilityForUser(session.user.id);
  const lockReason = availability?.lockReason ?? null;
  const effective = resolveEffectiveLevel(userFields);

  if (lockReason === "playbook-used" && effective === "PLAYBOOK") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description={SWING_COACHING_FORM_INTRO}
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
        description={SWING_COACHING_FORM_INTRO}
        message={freeSubmissionUsedUpgradeMessage}
        upgradeLabel="Join the 12-Week Program"
        upgradeHref="/program"
      />
    );
  }

  if (lockReason === "pending-quick-report") {
    return (
      <LockedFeaturePanel
        title="Coaching Submissions"
        description={SWING_COACHING_FORM_INTRO}
        message="Coach Broc is finishing your written report. You can submit again after it is sent."
        upgradeLabel="View profile"
        upgradeHref="/profile"
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

  if (lockReason === "monthly-limit") {
    const hasExtraSwing =
      unusedExtraReviewCredits > 0 &&
      listSwingCoachingAllowanceFormOptions(userFields, new Date(), {
        unusedExtraReviewCredits,
      }).some((option) => option.canSubmit);
    if (!hasExtraSwing) {
      return (
        <CoachingMonthlyLimitPanel
          title="Coaching Submissions"
          description={SWING_COACHING_FORM_INTRO}
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

  const swingOptions = listSwingCoachingAllowanceFormOptions(userFields, new Date(), {
    unusedExtraReviewCredits,
  });
  const hasSubmittableSwing = swingOptions.some((option) => option.canSubmit);

  if (!hasSubmittableSwing) {
    const keepBuilding = await loadKeepBuildingCoachingContextForUser(session.user.id);
    if (keepBuilding) {
      return (
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
            <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
              Coaching Submissions
            </h1>
            <div className="mt-6">
              <KeepBuildingSwingCard context={keepBuilding} />
            </div>
          </section>
        </div>
      );
    }
    redirect("/upgrade");
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

  const accessFields = accessUser ? mergeOrgIntoAccessFields(accessUser) : null;
  const effectiveLevel = accessFields ? resolveEffectiveLevel(accessFields) : "FREE";
  const confirmationVariant = getSwingSubmissionConfirmationVariant(effectiveLevel);
  const weeklyFocus = await loadCurrentOrgWeeklyFocusForUser(session.user.id);
  const allowanceBuildOptions = { unusedExtraReviewCredits };
  const requiresAllowanceChoice = requiresSwingAllowanceFormChoice(
    userFields,
    new Date(),
    allowanceBuildOptions,
  );
  const defaultHideResponsePreference = shouldHideSwingResponsePreference(effectiveLevel);
  const quotaFallbackCopy = buildReviewAllowanceFallbackCopy(getReviewAllowance(userFields), {
    coreQuickReportNextEligibleAt: userFields.coreQuickReportNextEligibleAt,
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Coaching Submissions
        </h1>
        <p className="mt-2 text-zinc-300">{SWING_COACHING_FORM_INTRO}</p>

        <SwingAnalysisForm
          confirmationVariant={confirmationVariant}
          defaultHideResponsePreference={defaultHideResponsePreference}
          weeklyFocusTitle={weeklyFocus?.title ?? null}
          swingAllowanceOptions={swingOptions}
          requiresSwingAllowanceChoice={requiresAllowanceChoice}
          coachingSubmissionPeriod={userFields.coachingSubmissionPeriod}
          extraReviewUseByIso={
            extraReviewState?.nextCreditExpiresAt?.toISOString() ?? null
          }
          quotaFallbackCopy={quotaFallbackCopy}
        />
      </section>
    </div>
  );
}
