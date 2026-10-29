"use client";

import type {
  CoachingAllowancePickerOption,
  CoachingAllowancePoolId,
} from "@/lib/coaching-submission-pool-shared";

type SwingAllowanceChoiceProps = {
  options: CoachingAllowancePickerOption[];
  selectedPoolId: CoachingAllowancePoolId | null;
  onSelect: (poolId: CoachingAllowancePoolId) => void;
};

export default function SwingAllowanceChoice({
  options,
  selectedPoolId,
  onSelect,
}: SwingAllowanceChoiceProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-zinc-100">What do you want from me?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedPoolId === option.poolId;
          const disabled = !option.canSubmit;
          return (
            <label
              key={option.poolId}
              className={`block rounded-xl border p-4 transition ${
                disabled
                  ? "cursor-not-allowed border-[#2b3650]/80 bg-black/20 opacity-60"
                  : isSelected
                    ? "cursor-pointer border-[#22c55e]/60 bg-[#22c55e]/10"
                    : "cursor-pointer border-[#2b3650] bg-black/30 hover:border-[#3c4a68]"
              }`}
            >
              <input
                type="radio"
                name="swingAllowance"
                value={option.poolId}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onSelect(option.poolId)}
                className="sr-only"
              />
              <p className="text-sm font-semibold text-zinc-100">{option.swingFormTitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{option.swingFormDescription}</p>
              <p className="mt-2 text-xs font-medium text-[#9df3bd]">[{option.availabilityLine}]</p>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
