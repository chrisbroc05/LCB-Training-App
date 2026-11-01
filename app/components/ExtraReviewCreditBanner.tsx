import { formatUnusedExtraReviewCreditsMessage } from "@/lib/extra-review-shared";

type ExtraReviewCreditBannerProps = {
  unusedCredits: number;
  nextCreditExpiresAt: string | null;
};

export default function ExtraReviewCreditBanner({
  unusedCredits,
  nextCreditExpiresAt,
}: ExtraReviewCreditBannerProps) {
  if (unusedCredits <= 0) {
    return null;
  }

  const message = formatUnusedExtraReviewCreditsMessage({
    count: unusedCredits,
    useByDate: nextCreditExpiresAt ? new Date(nextCreditExpiresAt) : null,
  });

  return (
    <div className="mt-4 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 px-4 py-4 text-sm text-[#bafccf]">
      {message}
    </div>
  );
}
