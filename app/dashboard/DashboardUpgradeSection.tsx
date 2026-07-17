"use client";

import Link from "next/link";
import { useState } from "react";
import AnnualSavingsBadge from "@/app/AnnualSavingsBadge";
import OneTimePaymentBadge from "@/app/OneTimePaymentBadge";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import UpgradeActions from "@/app/upgrade/UpgradeActions";
import { getAnnualSavings, getTierPricing, isOneTimeTier, usesBillingFrequencyToggle, type BillingFrequency } from "@/lib/billing";
import {
  keyToDatabaseTier,
  membershipTiers,
  type DatabaseTier,
  type TierKey,
} from "@/lib/membership";

type DashboardUpgradeSectionProps = {
  membershipTier: DatabaseTier;
  hasSubscription: boolean;
};

type UpgradeSectionConfig = {
  title: string;
  description: string;
  upgradeTiers: TierKey[];
};

const upgradeSectionByTier: Partial<Record<DatabaseTier, UpgradeSectionConfig>> = {
  FREE: {
    title: "Ready to Level Up?",
    description:
      "Choose a paid plan to unlock the full drill library, resources, and coaching support.",
    upgradeTiers: ["basic", "memorable", "elite"],
  },
  BASIC: {
    title: "Unlock Coaching Submissions",
    description:
      "Upgrade to Memorable for monthly coaching submissions and accountability check-ins, or Elite for priority response and personalized plans.",
    upgradeTiers: ["memorable", "elite"],
  },
  MEMORABLE: {
    title: "Get Priority Access",
    description:
      "Elite adds priority 24-hour response, monthly group coaching calls, a personalized development plan, and a weekly training plan from Coach Broc.",
    upgradeTiers: ["elite"],
  },
};

function getGridClassName(count: number) {
  if (count === 1) {
    return "mx-auto max-w-md grid grid-cols-1";
  }
  if (count === 2) {
    return "grid grid-cols-1 gap-5 md:grid-cols-2";
  }
  return "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3";
}

export default function DashboardUpgradeSection({
  membershipTier,
  hasSubscription,
}: DashboardUpgradeSectionProps) {
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");
  const config = upgradeSectionByTier[membershipTier];

  if (!config) {
    return null;
  }

  const upgradeTierCards = membershipTiers.filter((tier) =>
    config.upgradeTiers.includes(tier.key),
  );
  const freeTier = membershipTiers.find((tier) => tier.key === "free");

  return (
    <section className="mt-10 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          {config.title}
        </h2>
        <p className="mt-2 text-zinc-300">{config.description}</p>
      </div>

      {membershipTier === "FREE" && freeTier ? (
        <article className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-zinc-100">{freeTier.name}</h3>
          <p className="mt-2 text-2xl font-bold text-[#98b144]">$0</p>
          <p className="mt-3 text-sm text-zinc-300">{freeTier.summary}</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-200">
            {freeTier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      <div className="mt-6 flex flex-col items-center gap-2">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
        <p className="text-xs text-zinc-400">
          Monthly and annual pricing applies to Memorable and Elite only.
        </p>
      </div>

      <div className={`mt-8 ${getGridClassName(upgradeTierCards.length)}`}>
        {upgradeTierCards.map((tier) => {
          const pricing = getTierPricing(tier.key, billingFrequency);
          const oneTimeTier = isOneTimeTier(tier.key);
          const annualSavings =
            usesBillingFrequencyToggle(tier.key) && billingFrequency === "annual"
              ? getAnnualSavings(tier.key)
              : null;
          const databaseTier = keyToDatabaseTier[tier.key] as "BASIC" | "MEMORABLE" | "ELITE";

          return (
            <article
              key={tier.key}
              className="relative rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-lg shadow-black/40 sm:p-6"
            >
              {oneTimeTier ? (
                <OneTimePaymentBadge className="absolute right-4 top-4" />
              ) : annualSavings ? (
                <AnnualSavingsBadge amount={annualSavings} className="absolute right-4 top-4" />
              ) : null}
              <h3
                className={`text-xl font-semibold text-zinc-100${
                  oneTimeTier || annualSavings ? " pr-16" : ""
                }`}
              >
                {tier.name}
              </h3>
              <p className="mt-2 text-2xl font-bold text-[#98b144]">{pricing.primary}</p>
              {pricing.secondary ? (
                <p className="mt-1 text-sm text-zinc-400">{pricing.secondary}</p>
              ) : null}
              <p className="mt-3 text-sm text-zinc-300">{tier.summary}</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-200">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {hasSubscription ? (
                <Link
                  href={`/settings?tier=${tier.key}&billing=${billingFrequency}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                >
                  Upgrade to {tier.name}
                </Link>
              ) : (
                <div className="mt-6 [&_button]:w-full">
                  <UpgradeActions tier={databaseTier} billingFrequency={billingFrequency} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
