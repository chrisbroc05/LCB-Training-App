import Link from "next/link";
import LockedContentUpsell from "@/app/components/LockedContentUpsell";
import type { EffectiveAccessLevel } from "@/lib/access-shared";

type PlaybookWorkoutsUpgradeCardProps = {
  effective: EffectiveAccessLevel;
};

export default function PlaybookWorkoutsUpgradeCard({ effective }: PlaybookWorkoutsUpgradeCardProps) {
  return (
    <article className="mt-8 rounded-2xl border border-[#52B788]/40 bg-[#22c55e]/5 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Full workout programs</h2>
      <p className="mt-2 text-sm text-zinc-300">
        Your Playbook includes four bonus guides. The full Strength, Speed and Agility, and Mobility
        PDFs unlock with a higher membership level.
      </p>
      <LockedContentUpsell effective={effective} className="mt-3 text-sm text-zinc-400" />
      <Link
        href="/program"
        className="mt-4 inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
      >
        See the 12-Week Program
      </Link>
    </article>
  );
}
