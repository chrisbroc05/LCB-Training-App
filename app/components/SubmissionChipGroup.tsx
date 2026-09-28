"use client";

type SubmissionChipGroupProps = {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
  required?: boolean;
};

export default function SubmissionChipGroup({
  label,
  options,
  value,
  onChange,
  required = false,
}: SubmissionChipGroupProps) {
  return (
    <fieldset>
      <legend className="text-sm text-zinc-300">
        {label}
        {required ? <span className="text-zinc-500"> (required)</span> : null}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selected
                  ? "border-[#52B788] bg-[#52B788]/15 text-[#9df3bd]"
                  : "border-[#2b3650] bg-black/40 text-zinc-300 hover:border-[#3b4b6a]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
