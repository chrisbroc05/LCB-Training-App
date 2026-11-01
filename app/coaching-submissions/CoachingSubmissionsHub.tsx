import Link from "next/link";
import ExtraReviewCreditBanner from "@/app/components/ExtraReviewCreditBanner";
import ExtraReviewOffer from "@/app/components/ExtraReviewOffer";
import type { CoachingAllowancePickerOption } from "@/lib/coaching-submission-pool-shared";
import { formatCoachingAllowanceSummaryLine } from "@/lib/coaching-submission-pool-shared";
import type { ExtraReviewUiProps } from "@/lib/extra-review-ui-shared";
import { formatMonthlyCoachingLimitMessage } from "@/lib/coaching-submissions-shared";

type CoachingSubmissionsHubProps = {
  summaryOptions: CoachingAllowancePickerOption[];
  responseTimeLabel: string;
  showHistoryLink: boolean;
  extraReview?: ExtraReviewUiProps | null;
  monthlyReviewUsed?: boolean;
};

export default function CoachingSubmissionsHub({
  summaryOptions,
  responseTimeLabel,
  showHistoryLink,
  extraReview = null,
  monthlyReviewUsed = false,
}: CoachingSubmissionsHubProps) {
  const plusMonthlyUsed =
    monthlyReviewUsed ||
    summaryOptions.some((option) => option.poolId === "plus-monthly" && !option.canSubmit);
  const hasUnusedExtraReview = (extraReview?.unusedCredits ?? 0) > 0;
  const showMonthlyLimitBanner = plusMonthlyUsed && !hasUnusedExtraReview;
  return (
    <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
        Coaching Submissions
      </h1>
      <p className="mt-2 text-zinc-300">
        Choose the type of coaching support you need. Coach Broc typically responds within{" "}
        {responseTimeLabel}.
      </p>

      {showMonthlyLimitBanner ? (
        <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          {formatMonthlyCoachingLimitMessage()}
        </div>
      ) : null}

      {extraReview ? (
        <ExtraReviewCreditBanner
          unusedCredits={extraReview.unusedCredits}
          nextCreditExpiresAt={extraReview.nextCreditExpiresAt}
        />
      ) : null}

      {summaryOptions.length > 0 ? (
        <div className="mt-6 rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5">
          <p className="text-sm font-semibold text-zinc-100">What you have:</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {summaryOptions.map((option) => (
              <li key={option.poolId} className="leading-relaxed">
                {formatCoachingAllowanceSummaryLine(option)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {extraReview && plusMonthlyUsed && extraReview.unusedCredits === 0 ? (
        <ExtraReviewOffer
          canPurchase={extraReview.canPurchase}
          unusedCredits={extraReview.unusedCredits}
          blockReason={extraReview.blockReason}
          nextPurchaseEligibleAt={extraReview.nextPurchaseEligibleAt}
        />
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-zinc-100">Swing Video Feedback</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Upload a swing video with context so Coach Broc can provide targeted mechanical
            feedback.
          </p>
          <Link
            href="/swing-analysis"
            className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Submit Swing Video
          </Link>
        </article>

        <article className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-zinc-100">Mindset Support</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Share what you are working through mentally for guidance on confidence, focus, and
            composure.
          </p>
          <Link
            href="/mental-game"
            className="mt-4 inline-flex rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-4 py-2 text-sm font-semibold text-[#9df3bd] transition hover:bg-[#22c55e]/20"
          >
            Submit Mindset Request
          </Link>
        </article>
      </div>

      {showHistoryLink ? (
        <Link
          href="/profile"
          className="mt-6 inline-flex text-sm font-medium text-[#98b144] transition hover:text-[#b5d84f]"
        >
          View submission history
        </Link>
      ) : null}
    </section>
  );
}
