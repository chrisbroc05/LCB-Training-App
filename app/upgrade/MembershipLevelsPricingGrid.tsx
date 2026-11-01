"use client";

import { useState } from "react";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import MembershipLevelCheckoutButton from "@/app/components/MembershipLevelCheckoutButton";
import MembershipLevelSignupLink from "@/app/components/MembershipLevelSignupLink";
import type { BillingFrequency } from "@/lib/billing";
import {
  ANNUAL_MEMBERSHIP_REFUND_POLICY_SHORT,
  getMembershipLevelPriceDisplay,
  membershipLevelSupportsAnnualBilling,
  parseMembershipBillingInterval,
} from "@/lib/membership-billing-shared";
import {
  listPublicMembershipLevelDefinitions,
  MEMBERSHIP_LEVELS,
} from "@/lib/membership-levels-shared";

type Props = {
  signedIn: boolean;
  allAccessAvailable: boolean;
  clubOrgName?: string | null;
};

export default function MembershipLevelsPricingGrid({
  signedIn,
  allAccessAvailable,
  clubOrgName = null,
}: Props) {
  const levels = listPublicMembershipLevelDefinitions();
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");
  const billingInterval = parseMembershipBillingInterval(billingFrequency);

  if (levels.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Choose your level</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Monthly or annual billing on Core and Plus. Upgrade or change anytime from Settings.
      </p>
      <div className="mt-6 flex justify-center">
        <BillingFrequencyToggle value={billingFrequency} onChange={setBillingFrequency} />
      </div>
      {billingFrequency === "annual" ? (
        <p className="mt-3 text-center text-xs text-zinc-400">{ANNUAL_MEMBERSHIP_REFUND_POLICY_SHORT}</p>
      ) : null}
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {levels.map((level) => {
          const showAnnual = membershipLevelSupportsAnnualBilling(level.key);
          const intervalForLevel =
            showAnnual && billingFrequency === "annual" ? "ANNUAL" : "MONTHLY";
          const priceDisplay = getMembershipLevelPriceDisplay(level.key, intervalForLevel);
          return (
            <article
              key={level.key}
              className="flex flex-col rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6"
            >
              <h3 className="text-lg font-semibold text-zinc-100">{level.displayName}</h3>
              <p className="mt-1 text-sm text-[#52B788]">{level.tagline}</p>
              <p className="mt-3 text-2xl font-bold text-[#98b144]">{priceDisplay}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-300">{level.shortDescription}</p>
              <div className="mt-5">
                {signedIn ? (
                  <MembershipLevelCheckoutButton
                    level={level.key}
                    billingInterval={intervalForLevel}
                    label={`Subscribe to ${MEMBERSHIP_LEVELS[level.key].displayName}`}
                    showOrgCode={!clubOrgName}
                    clubOrgName={clubOrgName}
                    capFullWaitlist={level.key === "ALL_ACCESS" && !allAccessAvailable}
                  />
                ) : (
                  <MembershipLevelSignupLink
                    level={level.key}
                    billingInterval={intervalForLevel}
                  />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
