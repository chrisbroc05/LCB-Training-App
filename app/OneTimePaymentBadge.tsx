type OneTimePaymentBadgeProps = {
  className?: string;
};

export default function OneTimePaymentBadge({ className = "" }: OneTimePaymentBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full bg-[#52B788] px-2.5 py-1 text-xs font-bold text-[#0A1628] ${className}`}
    >
      One-Time Payment
    </span>
  );
}
