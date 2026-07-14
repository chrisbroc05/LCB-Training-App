type AnnualSavingsBadgeProps = {
  amount: number;
  className?: string;
};

export default function AnnualSavingsBadge({ amount, className = "" }: AnnualSavingsBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full bg-[#52B788] px-2.5 py-1 text-xs font-bold text-[#0A1628] ${className}`}
    >
      Save ${amount}
    </span>
  );
}
