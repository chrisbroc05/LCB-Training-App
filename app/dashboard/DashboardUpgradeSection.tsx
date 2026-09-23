"use client";

import Link from "next/link";
import { membershipTiers, type DatabaseTier } from "@/lib/membership";

type DashboardUpgradeSectionProps = {
  membershipTier: DatabaseTier;
};

export default function DashboardUpgradeSection({
  membershipTier,
}: DashboardUpgradeSectionProps) {
  if (membershipTier !== "FREE" && membershipTier !== "BASIC") {
    return null;
  }

  const freeTier = membershipTiers.find((tier) => tier.key === "free");

  return (
    <section className="mt-10 rounded-3xl border border-[#18243a] bg-[#0A1628] px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Ready to Level Up?
        </h2>
        <p className="mt-2 text-zinc-300">
          Join the 12-Week Coaching Program for unlimited submissions, full Playbook access, and
          weekly check-in calls with Coach Broc.
        </p>
      </div>

      <article className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#52B788]/40 bg-[#0b1324]/80 p-5 sm:p-6">
        <h3 className="text-xl font-semibold text-zinc-100">12-Week Coaching Program</h3>
        <p className="mt-3 text-sm text-zinc-300">
          Unlimited submissions, full Playbook access, workout programs, and weekly check-in calls
          with Coach Broc.
        </p>
        <Link
          href="/program"
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Explore the Program
        </Link>
      </article>

      {membershipTier === "FREE" && freeTier ? (
        <article className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-zinc-100">{freeTier.name}</h3>
          <p className="mt-2 text-2xl font-bold text-[#98b144]">$0</p>
          <p className="mt-3 text-sm text-zinc-300">{freeTier.summary}</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-200">
            {freeTier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
