import { formatDatabaseTierLabel, type DatabaseTier } from "@/lib/membership";

export default function TierBadge({ tier }: { tier: DatabaseTier }) {
  const styles: Record<DatabaseTier, string> = {
    FREE: "border-zinc-500/40 bg-zinc-500/15 text-zinc-200",
    BASIC: "border-blue-400/40 bg-blue-500/15 text-blue-100",
    MEMORABLE: "border-[#22c55e]/40 bg-[#22c55e]/15 text-[#9df3bd]",
    ELITE: "border-yellow-400/40 bg-yellow-500/15 text-yellow-100",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[tier]}`}
    >
      {formatDatabaseTierLabel(tier)}
    </span>
  );
}
