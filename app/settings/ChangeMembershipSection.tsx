"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import {
  formatTierPriceLabel,
  type BillingFrequency,
} from "@/lib/billing";
import {
  keyToDatabaseTier,
  membershipTiers,
  databaseTierToKey,
  type DatabaseTier,
} from "@/lib/membership";

type ChangeMembershipSectionProps = {
  currentTier: DatabaseTier;
  hasSubscription: boolean;
};

export default function ChangeMembershipSection({
  currentTier,
  hasSubscription,
}: ChangeMembershipSectionProps) {
  const router = useRouter();
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTier, setPendingTier] = useState<DatabaseTier | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableTiers = membershipTiers.filter(
    (tier) => tier.key !== "free" && tier.key !== databaseTierToKey[currentTier],
  );

  async function handleTierChange(nextTier: DatabaseTier) {
    const shouldContinue = window.confirm(
      `Switch your membership to ${nextTier.charAt(0)}${nextTier.slice(1).toLowerCase()}? Proration will be applied automatically by Stripe.`,
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
        {hasSubscription
          ? "Switch to another membership tier anytime. Stripe will automatically apply prorated charges or credits."
          : "Choose a paid tier to start your subscription through Stripe checkout."}
      </p>
      <div className="mt-5 flex justify-center">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
      </div>
      <div className="mt-5 grid gap-4">
        {availableTiers.map((tier) => {
          const nextTier = keyToDatabaseTier[tier.key];
          const isPending = pendingTier === nextTier;
          const priceLabel = formatTierPriceLabel(tier.key, billingFrequency);

          return (
            <article
              key={tier.key}
              className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">{tier.name}</h3>
                  <p className="text-sm text-[#9df3bd]">{priceLabel}</p>
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
