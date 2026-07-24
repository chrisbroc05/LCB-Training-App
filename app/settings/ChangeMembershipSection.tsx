"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import AnnualSavingsBadge from "@/app/AnnualSavingsBadge";
import OneTimePaymentBadge from "@/app/OneTimePaymentBadge";
import SettingsCard from "@/app/settings/SettingsCard";
import {
  settingsBodyTextClass,
  settingsErrorMessageClass,
  settingsInnerCardClass,
  settingsInnerCardHighlightedClass,
  settingsMutedTextClass,
  settingsPrimaryButtonClass,
  settingsSectionTitleClass,
  settingsSuccessMessageClass,
} from "@/app/settings/settings-styles";
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
  memorableUpgradePitch,
  databaseTierToKey,
  type DatabaseTier,
} from "@/lib/membership";

type ChangeMembershipSectionProps = {
  currentTier: DatabaseTier;
  hasSubscription: boolean;
  isLifetimeBasic?: boolean;
  isManualMembership?: boolean;
};

export default function ChangeMembershipSection({
  currentTier,
  hasSubscription,
  isLifetimeBasic = false,
  isManualMembership = false,
}: ChangeMembershipSectionProps) {
  return (
    <Suspense fallback={null}>
      <ChangeMembershipContent
        currentTier={currentTier}
        hasSubscription={hasSubscription}
        isLifetimeBasic={isLifetimeBasic}
        isManualMembership={isManualMembership}
      />
    </Suspense>
  );
}

function ChangeMembershipContent({
  currentTier,
  hasSubscription,
  isLifetimeBasic,
  isManualMembership = false,
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
    <SettingsCard
      title="Upgrade Membership"
      description={
        isLifetimeBasic
          ? `Upgrade to Memorable or Elite for ${memorableUpgradePitch}`
          : isManualMembership
            ? "Upgrade to Elite for additional coaching submissions, priority response, and recruiting support."
            : hasSubscription
              ? "Switch to another membership tier anytime. Stripe will automatically apply prorated charges or credits."
              : "Choose a paid tier to unlock more training content and coaching support."
      }
    >
      <div className="flex flex-col items-center gap-2">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
        <p className={settingsMutedTextClass}>
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
              className={
                isHighlighted ? settingsInnerCardHighlightedClass : settingsInnerCardClass
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className={`text-base ${settingsSectionTitleClass}`}>{tier.name}</h3>
                  {oneTimeTier ? (
                    <div className="mt-2">
                      <OneTimePaymentBadge />
                    </div>
                  ) : annualSavings ? (
                    <div className="mt-2">
                      <AnnualSavingsBadge amount={annualSavings} />
                    </div>
                  ) : null}
                  <p className={`mt-2 font-semibold ${settingsBodyTextClass}`}>{priceLabel}</p>
                  {!oneTimeTier && pricing.secondary ? (
                    <p className={settingsMutedTextClass}>{pricing.secondary}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleTierChange(nextTier)}
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto ${settingsPrimaryButtonClass}`}
                >
                  {isPending
                    ? "Updating..."
                    : hasSubscription
                      ? `Switch to ${tier.name}`
                      : `Upgrade to ${tier.name}`}
                </button>
              </div>
              <p className={`mt-3 ${settingsBodyTextClass}`}>{tier.summary}</p>
              <ul className={`mt-3 list-disc space-y-1 pl-5 ${settingsBodyTextClass}`}>
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      {error ? <p className={`mt-4 ${settingsErrorMessageClass}`}>{error}</p> : null}
      {success ? <p className={`mt-4 ${settingsSuccessMessageClass}`}>{success}</p> : null}
    </SettingsCard>
  );
}
