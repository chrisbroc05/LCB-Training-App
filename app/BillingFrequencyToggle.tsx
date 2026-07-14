"use client";

import type { BillingFrequency } from "@/lib/billing";

type BillingFrequencyToggleProps = {
  value: BillingFrequency;
  onChange: (value: BillingFrequency) => void;
};

export default function BillingFrequencyToggle({
  value,
  onChange,
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
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            value === "annual"
              ? "bg-[#22c55e] text-black"
              : "text-zinc-300 hover:text-zinc-100"
          }`}
        >
          Annually
        </button>
      </div>
      {value === "annual" ? (
        <span className="rounded-full bg-[#22c55e]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
          Save 2 months!
        </span>
      ) : null}
    </div>
  );
}
