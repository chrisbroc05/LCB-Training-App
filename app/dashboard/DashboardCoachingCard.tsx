import Link from "next/link";
import ExtraReviewOffer from "@/app/components/ExtraReviewOffer";
import ExtraReviewCreditBanner from "@/app/components/ExtraReviewCreditBanner";
import type { ExtraReviewUiProps } from "@/lib/extra-review-ui-shared";
import FreeMemberWhileYouWaitCards from "@/app/components/FreeMemberWhileYouWaitCards";
import KeepBuildingSwingCard from "@/app/components/KeepBuildingSwingCard";
import type { KeepBuildingCoachingContext } from "@/lib/coaching-keep-building-shared";
import type {
  CoachingSubmissionAvailability,
  CoachingSubmissionUserFields,
} from "@/lib/coaching-submissions-shared";
import { resolveEffectiveLevel, type AccessUserFields } from "@/lib/access-shared";
import { formatAssessmentCallDateTime } from "@/lib/assessment-call";
import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";
import { type DatabaseTier } from "@/lib/membership";
import {
  getHomeCoachingStatus,
  type OrgTrialReportContext,
} from "@/lib/home-coaching-status-shared";

type DashboardCoachingCardProps = {
  membershipTier: DatabaseTier;
  access: AccessUserFields;
  coachingUser: CoachingSubmissionUserFields | null;
  coachingAvailability: CoachingSubmissionAvailability | null;
  freeSubmissionUsed: boolean;
  assessmentCallBooked: boolean;
  assessmentCallDate: Date | null;
  keepBuildingCoaching?: KeepBuildingCoachingContext | null;
  extraReview?: ExtraReviewUiProps | null;
  orgTrialReport?: OrgTrialReportContext | null;
};

export default function DashboardCoachingCard({
  membershipTier,
  access,
  coachingUser,
  coachingAvailability,
  freeSubmissionUsed,
  assessmentCallBooked,
  assessmentCallDate,
  keepBuildingCoaching = null,
  extraReview = null,
  orgTrialReport = null,
}: DashboardCoachingCardProps) {
  if (keepBuildingCoaching) {
    return <KeepBuildingSwingCard context={keepBuildingCoaching} />;
  }

  const coachingFields = coachingUser ? { ...access, ...coachingUser } : null;
  const effective = coachingFields
    ? resolveEffectiveLevel(coachingFields)
    : resolveEffectiveLevel(access);

  if (coachingFields) {
    const status = getHomeCoachingStatus({
      user: coachingFields,
      orgTrialReport,
    });

    if (
      effective === "ORG_TRIAL" ||
      effective === "CORE" ||
      effective === "PLUS" ||
      effective === "ALL_ACCESS" ||
      effective === "TWELVE_WEEK" ||
      (effective === "FREE" && membershipTier === "FREE")
    ) {
      return (
        <div className="space-y-4 sm:space-y-5">
          <article
            className={`rounded-2xl border p-4 sm:p-6 ${
              status.canSubmit
                ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                : "border-[#18243a] bg-[#0b1324]/80"
            }`}
          >
            <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
            <p className="mt-3 text-sm text-zinc-200">{status.headline}</p>
            {status.detail ? <p className="mt-2 text-sm text-zinc-400">{status.detail}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              {status.primaryHref && status.primaryLabel ? (
                <Link
                  href={status.primaryHref}
                  className="inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                >
                  {status.primaryLabel}
                </Link>
              ) : null}
              {status.secondaryHref && status.secondaryLabel ? (
                <Link
                  href={status.secondaryHref}
                  className="inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144]"
                >
                  {status.secondaryLabel}
                </Link>
              ) : null}
            </div>
            {!status.canSubmit && extraReview ? (
              <>
                <ExtraReviewCreditBanner
                  unusedCredits={extraReview.unusedCredits}
                  nextCreditExpiresAt={extraReview.nextCreditExpiresAt}
                />
                {extraReview.unusedCredits === 0 ? (
                  <ExtraReviewOffer
                    canPurchase={extraReview.canPurchase}
                    unusedCredits={extraReview.unusedCredits}
                    blockReason={extraReview.blockReason}
                    nextPurchaseEligibleAt={extraReview.nextPurchaseEligibleAt}
                  />
                ) : null}
              </>
            ) : null}
            {effective === "FREE" && freeSubmissionUsed ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm font-medium text-zinc-200">
                  While you wait -- here is what else is waiting for you.
                </p>
                <FreeMemberWhileYouWaitCards />
              </div>
            ) : null}
          </article>

          {effective === "FREE" && membershipTier === "FREE" ? (
            assessmentCallBooked && assessmentCallDate ? (
              <article className="rounded-2xl border border-[#22c55e]/40 bg-[#0A1628] p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-100">Your Call is Scheduled</h2>
                  <span className="rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
                    Scheduled
                  </span>
                </div>
                <p className="mt-3 text-base font-medium text-[#9df3bd]">
                  {formatAssessmentCallDateTime(assessmentCallDate)}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Google Meet link will be in your Calendly confirmation email
                </p>
              </article>
            ) : (
              <article className="rounded-2xl border border-[#22c55e]/50 bg-[#22c55e]/10 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-zinc-100">Have questions?</h2>
                <p className="mt-3 text-sm text-zinc-300">Book a quick call with me.</p>
                <a
                  href={COACH_CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                >
                  Book a call
                </a>
              </article>
            )
          ) : null}
        </div>
      );
    }
  }

  if (coachingAvailability?.canSubmit) {
    return (
      <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
        <p className="mt-3 text-sm text-zinc-300">A coaching submission is available on your plan.</p>
        <Link
          href="/coaching-submissions"
          className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Go to Coaching Submissions
        </Link>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
      <p className="mt-3 text-sm text-zinc-300">
        Want more feedback from Coach Broc? Memberships include more swing reports.
      </p>
      <Link
        href="/upgrade"
        className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
      >
        See membership levels
      </Link>
    </article>
  );
}
