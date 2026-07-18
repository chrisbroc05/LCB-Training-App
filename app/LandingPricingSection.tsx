"use client";

import Link from "next/link";
import { useState } from "react";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import AnnualSavingsBadge from "@/app/AnnualSavingsBadge";
import OneTimePaymentBadge from "@/app/OneTimePaymentBadge";
import {
  getAnnualSavings,
  getTierPricing,
  isOneTimeTier,
  usesBillingFrequencyToggle,
  type BillingFrequency,
} from "@/lib/billing";
import { membershipTiers } from "@/lib/membership";

export default function LandingPricingSection() {
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");

  return (
    <section className="mt-14">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
            Choose Your Membership Tier
          </h2>
          <p className="mt-2 text-zinc-300">
            Start with Free, then move to the tier that fits your training schedule and support needs.
          </p>
        </div>
        <Link href="/auth" className="hidden text-sm font-medium text-[#98b144] md:block">
          Get started now -&gt;
        </Link>
      </div>

      <div className="mb-3 flex justify-center">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
      </div>
      <p className="mb-8 text-center text-xs text-zinc-400">
        Monthly and annual pricing applies to Memorable and Elite only.
      </p>

      <div className="grid gap-5 md:grid-cols-4">
        {membershipTiers.map((tier) => {
          const pricing = getTierPricing(tier.key, billingFrequency);
          const annualSavings =
            usesBillingFrequencyToggle(tier.key) && billingFrequency === "annual"
              ? getAnnualSavings(tier.key)
              : null;
          const oneTimeTier = isOneTimeTier(tier.key);

          return (
            <article
              key={tier.key}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6 shadow-lg shadow-black/40"
            >
              <h3 className="text-xl font-semibold text-zinc-100">{tier.name}</h3>
              {oneTimeTier ? (
                <div className="mt-2">
                  <OneTimePaymentBadge />
                </div>
              ) : annualSavings ? (
                <div className="mt-2">
                  <AnnualSavingsBadge amount={annualSavings} />
                </div>
              ) : null}
              <p className="mt-2 text-2xl font-bold text-[#98b144]">{pricing.primary}</p>
              {pricing.secondary ? (
                <p className="mt-1 text-sm text-zinc-400">{pricing.secondary}</p>
              ) : null}
              <p className="mt-3 text-zinc-300">{tier.summary}</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-200">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#22c55e]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={
                  tier.key === "free"
                    ? `/auth?tier=${tier.key}&mode=signup`
                    : tier.key === "basic"
                      ? `/auth?tier=${tier.key}&mode=signup`
                      : `/auth?tier=${tier.key}&mode=signup&billing=${billingFrequency}`
                }
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
              >
                Get Started
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
