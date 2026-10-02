"use client";

import Link from "next/link";
import { COACH_CALENDLY_URL } from "@/lib/coach-calendly-shared";
import type { DatabaseTier } from "@/lib/membership";

type DashboardUpgradeSectionProps = {
  membershipTier: DatabaseTier;
};

export default function DashboardUpgradeSection({
  membershipTier,
}: DashboardUpgradeSectionProps) {
  if (membershipTier !== "FREE" && membershipTier !== "BASIC") {
    return null;
  }

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

      {membershipTier === "FREE" ? (
        <article className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-zinc-100">Have questions?</h3>
          <p className="mt-3 text-sm text-zinc-300">
            Want to talk through the 12-Week Program first? Book a call with me.
          </p>
          <a
            href={COACH_CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Book a call
          </a>
        </article>
      ) : null}
    </section>
  );
}
