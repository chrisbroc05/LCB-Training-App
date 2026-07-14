"use client";

import { useState } from "react";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import UpgradeActions from "@/app/upgrade/UpgradeActions";
import { getTierPricing, type BillingFrequency } from "@/lib/billing";

const upgradeTiers = [
  {
    tier: "BASIC" as const,
    name: "Basic",
    summary: "Get full access to the hitting, fielding, and mindset drill libraries.",
    features: [
      "Full hitting video library",
      "Full fielding video library",
      "Mindset video library",
    ],
    cardClassName: "rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6",
    textClassName: "text-zinc-300",
    listClassName: "text-zinc-200",
  },
  {
    tier: "PRO" as const,
    name: "Pro",
    summary: "Everything in Basic plus ongoing personalized swing and mental game support.",
    features: [
      "Everything in Basic",
      "Ongoing swing analysis submissions",
      "Ongoing mental game support submissions",
    ],
    cardClassName: "rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-4 sm:p-6",
    textClassName: "text-zinc-200",
    listClassName: "text-zinc-100",
  },
  {
    tier: "ELITE" as const,
    name: "Elite",
    summary: "Everything in Pro with top-priority coaching responses and monthly group call access.",
    features: [
      "Everything in Pro",
      "Priority swing analysis feedback",
      "Priority mental game feedback",
      "Monthly live group calls",
    ],
    cardClassName: "rounded-2xl border border-[#7f9434]/40 bg-[#7f9434]/10 p-4 sm:p-6",
    textClassName: "text-zinc-200",
    listClassName: "text-zinc-100",
  },
];

export default function UpgradePricingSection() {
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");

  return (
    <>
      <div className="mt-8 flex justify-center">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
      </div>

      <section className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-3">
        {upgradeTiers.map((tier) => {
          const pricing = getTierPricing(tier.tier.toLowerCase() as "basic" | "pro" | "elite", billingFrequency);

          return (
            <article key={tier.tier} className={tier.cardClassName}>
              <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{tier.name}</h2>
              <p className="mt-2 text-2xl font-bold text-[#98b144]">{pricing.primary}</p>
              {pricing.secondary ? (
                <p className="mt-1 text-sm text-zinc-400">{pricing.secondary}</p>
              ) : null}
              <p className={`mt-3 ${tier.textClassName}`}>{tier.summary}</p>
              <ul className={`mt-4 list-disc space-y-2 pl-5 text-sm ${tier.listClassName}`}>
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <UpgradeActions tier={tier.tier} billingFrequency={billingFrequency} />
            </article>
          );
        })}
      </section>
    </>
  );
}
