"use client";

import { useState } from "react";
import { postCheckout } from "@/lib/checkout-client";
import {
  buildExtraReviewPurchaseBlockedMessage,
  EXTRA_REVIEW_OFFER_HEADLINE,
  type ExtraReviewPurchaseBlockReason,
} from "@/lib/extra-review-shared";

type ExtraReviewOfferProps = {
  canPurchase: boolean;
  unusedCredits: number;
  blockReason: ExtraReviewPurchaseBlockReason;
  nextPurchaseEligibleAt: string | null;
};

export default function ExtraReviewOffer({
  canPurchase,
  unusedCredits,
  blockReason,
  nextPurchaseEligibleAt,
}: ExtraReviewOfferProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (unusedCredits > 0) {
    return null;
  }

  async function handleBuy() {
    setLoading(true);
    setError("");
    try {
      const result = await postCheckout("/api/stripe/checkout/extra-review", {});
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setError(result.error ?? "Unable to start checkout.");
    } catch {
      setError("Unable to start checkout.");
    } finally {
      setLoading(false);
    }
  }

  const blockedMessage =
    !canPurchase && blockReason
      ? buildExtraReviewPurchaseBlockedMessage({
          reason: blockReason,
          nextEligibleAt: nextPurchaseEligibleAt ? new Date(nextPurchaseEligibleAt) : null,
        })
      : null;

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-[#2b3650] bg-black/30 p-4">
      <p className="text-sm text-zinc-200">{EXTRA_REVIEW_OFFER_HEADLINE}</p>
      {blockedMessage ? <p className="text-sm text-zinc-400">{blockedMessage}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {canPurchase ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleBuy()}
          className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:opacity-60"
        >
          {loading ? "Starting checkout..." : "Buy"}
        </button>
      ) : null}
    </div>
  );
}
