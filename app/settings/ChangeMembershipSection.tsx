"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import AnnualSavingsBadge from "@/app/AnnualSavingsBadge";
import OneTimePaymentBadge from "@/app/OneTimePaymentBadge";
import {
  formatTierPriceLabel,
  getAnnualSavings,
  getTierPricing,
  isOneTimeTier,
  parseBillingFrequency,
  usesBillingFrequencyToggle,
  type BillingFrequency,
} from "@/lib/billing";
import {
  formatDatabaseTierLabel,
  keyToDatabaseTier,
  membershipTiers,
  databaseTierToKey,
  type DatabaseTier,
} from "@/lib/membership";

type ChangeMembershipSectionProps = {
  currentTier: DatabaseTier;
  hasSubscription: boolean;
  isLifetimeBasic?: boolean;
};

export default function ChangeMembershipSection({
  currentTier,
  hasSubscription,
  isLifetimeBasic = false,
}: ChangeMembershipSectionProps) {
  return (
    <Suspense fallback={null}>
      <ChangeMembershipContent
        currentTier={currentTier}
        hasSubscription={hasSubscription}
        isLifetimeBasic={isLifetimeBasic}
      />
    </Suspense>
  );
}

function ChangeMembershipContent({
  currentTier,
  hasSubscription,
  isLifetimeBasic,
}: ChangeMembershipSectionProps) {
  const searchParams = useSearchParams();
  const highlightedTierKey = searchParams.get("tier")?.toLowerCase();
  const router = useRouter();
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>(
    parseBillingFrequency(searchParams.get("billing")),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTier, setPendingTier] = useState<DatabaseTier | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableTiers = membershipTiers.filter(
    (tier) => tier.key !== "free" && tier.key !== databaseTierToKey[currentTier],
  );

  async function handleTierChange(nextTier: DatabaseTier) {
    const shouldContinue = window.confirm(
      hasSubscription
        ? `Switch your membership to ${formatDatabaseTierLabel(nextTier)}? Proration will be applied automatically by Stripe.`
        : `Continue to checkout for ${formatDatabaseTierLabel(nextTier)}?`,
    );
    if (!shouldContinue) {
      return;
    }

    setIsSubmitting(true);
    setPendingTier(nextTier);
    setError("");
    setSuccess("");

    try {
      if (hasSubscription) {
        const response = await fetch("/api/stripe/subscription/change-tier", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ membershipTier: nextTier, billingFrequency }),
        });

        const data = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "Unable to update membership tier.");
          return;
        }

        setSuccess("Membership updated successfully. Your plan access has been refreshed.");
        router.refresh();
      } else {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ membershipTier: nextTier, billingFrequency }),
        });

        const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string };
        if (!response.ok || !data.url) {
          setError(data.error ?? "Unable to start checkout.");
          return;
        }

        window.location.href = data.url;
      }
    } catch {
      setError("Unable to update membership tier right now. Please try again.");
    } finally {
      setIsSubmitting(false);
      setPendingTier(null);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Upgrade Membership</h2>
      <p className="mt-2 text-zinc-300">
        {isLifetimeBasic
          ? "Upgrade to Memorable or Elite for 1-on-1 coaching, monthly swing analysis and mental game support submissions, accountability support, and priority access to Coach Broc."
          : hasSubscription
            ? "Switch to another membership tier anytime. Stripe will automatically apply prorated charges or credits."
            : "Choose a paid tier to unlock more training content and coaching support."}
      </p>
      <div className="mt-5 flex flex-col items-center gap-2">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
        <p className="text-xs text-zinc-400">
          Monthly and annual pricing applies to Memorable and Elite only.
        </p>
      </div>
      <div className="mt-5 grid gap-4">
        {availableTiers.map((tier) => {
          const nextTier = keyToDatabaseTier[tier.key];
          const isPending = pendingTier === nextTier;
          const pricing = getTierPricing(tier.key, billingFrequency);
          const priceLabel = formatTierPriceLabel(tier.key, billingFrequency);
          const isHighlighted = highlightedTierKey === tier.key;
          const oneTimeTier = isOneTimeTier(tier.key);
          const annualSavings =
            usesBillingFrequencyToggle(tier.key) && billingFrequency === "annual"
              ? getAnnualSavings(tier.key)
              : null;

          return (
            <article
              key={tier.key}
              className={`rounded-xl border bg-black/30 p-4 sm:p-5 ${
                isHighlighted
                  ? "border-[#52B788] bg-[#0f1d34]"
                  : "border-[#2b3650]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">{tier.name}</h3>
                  {oneTimeTier ? (
                    <div className="mt-2">
                      <OneTimePaymentBadge />
                    </div>
                  ) : annualSavings ? (
                    <div className="mt-2">
                      <AnnualSavingsBadge amount={annualSavings} />
                    </div>
                  ) : null}
                  <p className="mt-2 text-sm text-[#9df3bd]">{priceLabel}</p>
                  {!oneTimeTier && pricing.secondary ? (
                    <p className="text-xs text-zinc-400">{pricing.secondary}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleTierChange(nextTier)}
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-[#22c55e]/70 bg-[#22c55e]/10 px-4 py-2 text-sm font-semibold text-[#8df0b1] transition hover:bg-[#22c55e]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isPending
                    ? "Updating..."
                    : hasSubscription
                      ? `Switch to ${tier.name}`
                      : `Upgrade to ${tier.name}`}
                </button>
              </div>
              <p className="mt-3 text-sm text-zinc-300">{tier.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      {success && <p className="mt-4 text-sm text-[#9df3bd]">{success}</p>}
    </section>
  );
}
