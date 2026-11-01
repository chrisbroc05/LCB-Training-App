import type { ExtraReviewPurchaseBlockReason } from "@/lib/extra-review-shared";

export type ExtraReviewUiProps = {
  canPurchase: boolean;
  unusedCredits: number;
  blockReason: ExtraReviewPurchaseBlockReason;
  nextPurchaseEligibleAt: string | null;
  nextCreditExpiresAt: string | null;
};

export function mapExtraReviewUiState(state: {
  canPurchase: boolean;
  unusedCredits: number;
  blockReason: ExtraReviewPurchaseBlockReason;
  nextPurchaseEligibleAt: Date | null;
  nextCreditExpiresAt: Date | null;
}): ExtraReviewUiProps {
  return {
    canPurchase: state.canPurchase,
    unusedCredits: state.unusedCredits,
    blockReason: state.blockReason,
    nextPurchaseEligibleAt: state.nextPurchaseEligibleAt?.toISOString() ?? null,
    nextCreditExpiresAt: state.nextCreditExpiresAt?.toISOString() ?? null,
  };
}
