import Link from "next/link";
import ExtraReviewOffer from "@/app/components/ExtraReviewOffer";
import type { ExtraReviewUiProps } from "@/lib/extra-review-ui-shared";

type CoachingMonthlyLimitPanelProps = {
  title: string;
  description: string;
  message: string;
  showExtraReviewOffer: boolean;
  extraReview: ExtraReviewUiProps | null;
  upgradeLabel?: string;
  upgradeHref?: string;
};

export default function CoachingMonthlyLimitPanel({
  title,
  description,
  message,
  showExtraReviewOffer,
  extraReview,
  upgradeLabel = "View Membership",
  upgradeHref = "/settings",
}: CoachingMonthlyLimitPanelProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-zinc-300">{description}</p>

        <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          {message}
        </div>

        {showExtraReviewOffer && extraReview ? (
          <ExtraReviewOffer
            canPurchase={extraReview.canPurchase}
            unusedCredits={extraReview.unusedCredits}
            blockReason={extraReview.blockReason}
            nextPurchaseEligibleAt={extraReview.nextPurchaseEligibleAt}
          />
        ) : null}

        <div className="mt-6">
          <Link
            href={upgradeHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-[#2b3650] bg-black/40 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144] sm:w-auto"
          >
            {upgradeLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
