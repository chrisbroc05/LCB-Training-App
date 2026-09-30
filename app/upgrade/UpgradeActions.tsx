"use client";

import { useState } from "react";
import type { BillingFrequency } from "@/lib/billing";
import { PLAYBOOK_PURCHASE_BUTTON_LABEL } from "@/lib/playbook-branding";
import { postCheckout } from "@/lib/checkout-client";
import { formatDatabaseTierLabel, type DatabaseTier } from "@/lib/membership";

type UpgradeActionsProps = {
  tier: Exclude<DatabaseTier, "FREE">;
  billingFrequency?: BillingFrequency;
  buttonLabel?: string;
};

export default function UpgradeActions({
  tier,
  billingFrequency = "monthly",
  buttonLabel,
}: UpgradeActionsProps) {
  const tierLabel = formatDatabaseTierLabel(tier);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setIsLoading(true);
    setError("");

    try {
      const payload =
        tier === "BASIC"
          ? await postCheckout("/api/stripe/checkout/basic")
          : tier === "TWELVE_WEEK"
            ? await postCheckout("/api/stripe/checkout/twelve-week")
            : await postCheckout("/api/stripe/checkout", {
                membershipTier: tier,
                billingFrequency,
              });

      window.location.href = payload.url!;
    } catch {
      setError("Unable to start checkout right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={startCheckout}
        disabled={isLoading}
        className={`inline-flex h-12 w-full items-center justify-center rounded-full bg-[#22c55e] px-6 text-sm font-semibold text-[#0A1628] transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
      >
        {isLoading
          ? "Redirecting..."
          : buttonLabel ??
            (tier === "BASIC" ? PLAYBOOK_PURCHASE_BUTTON_LABEL : `Upgrade to ${tierLabel}`)}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
