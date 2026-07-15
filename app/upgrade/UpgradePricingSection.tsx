"use client";

import { useState } from "react";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import UpgradeActions from "@/app/upgrade/UpgradeActions";
import { getTierPricing, type BillingFrequency } from "@/lib/billing";
import {
  keyToDatabaseTier,
  paidMembershipTiers,
  type TierKey,
} from "@/lib/membership";

const paidTierCardStyles: Record<
  Exclude<TierKey, "free">,
  {
    cardClassName: string;
    textClassName: string;
    listClassName: string;
  }
> = {
  basic: {
    cardClassName: "rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6",
    textClassName: "text-zinc-300",
    listClassName: "text-zinc-200",
  },
  memorable: {
    cardClassName: "rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-4 sm:p-6",
    textClassName: "text-zinc-200",
    listClassName: "text-zinc-100",
  },
  elite: {
    cardClassName: "rounded-2xl border border-[#7f9434]/40 bg-[#7f9434]/10 p-4 sm:p-6",
    textClassName: "text-zinc-200",
    listClassName: "text-zinc-100",
  },
};

export default function UpgradePricingSection() {
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");

  return (
    <>
      <div className="mt-8 flex justify-center">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
      </div>

      <section className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-3">
        {paidMembershipTiers.map((tier) => {
          const pricing = getTierPricing(tier.key, billingFrequency);
          const styles = paidTierCardStyles[tier.key];
          const databaseTier = keyToDatabaseTier[tier.key] as "BASIC" | "MEMORABLE" | "ELITE";

          return (
            <article key={tier.key} className={styles.cardClassName}>
              <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{tier.name}</h2>
              <p className="mt-2 text-2xl font-bold text-[#98b144]">{pricing.primary}</p>
              {pricing.secondary ? (
                <p className="mt-1 text-sm text-zinc-400">{pricing.secondary}</p>
              ) : null}
              <p className={`mt-3 ${styles.textClassName}`}>{tier.summary}</p>
              <ul className={`mt-4 list-disc space-y-2 pl-5 text-sm ${styles.listClassName}`}>
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <UpgradeActions tier={databaseTier} billingFrequency={billingFrequency} />
            </article>
          );
        })}
      </section>
    </>
  );
}
