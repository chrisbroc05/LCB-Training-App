"use client";

import type { BillingFrequency } from "@/lib/billing";
import { MEMBERSHIP_YEARLY_SAVINGS_SUMMARY } from "@/lib/membership-billing-shared";

type BillingFrequencyToggleProps = {
  value: BillingFrequency;
  onChange: (value: BillingFrequency) => void;
  /** When false, hide the always-on yearly savings line (legacy tier pricing). Default true. */
  showYearlySavingsSummary?: boolean;
};

export default function BillingFrequencyToggle({
  value,
  onChange,
  showYearlySavingsSummary = true,
}: BillingFrequencyToggleProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="inline-flex rounded-full border border-[#2b3650] bg-black/40 p-1">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            value === "monthly"
              ? "bg-[#22c55e] text-black"
              : "text-zinc-300 hover:text-zinc-100"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${
            value === "annual"
              ? "bg-[#22c55e] text-black"
              : "text-zinc-300 hover:text-zinc-100"
          }`}
        >
          Yearly - 2 months free
        </button>
      </div>
      {showYearlySavingsSummary ? (
        <p className="max-w-xl text-center text-xs leading-relaxed text-zinc-400">
          {MEMBERSHIP_YEARLY_SAVINGS_SUMMARY}
        </p>
      ) : null}
    </div>
  );
}
