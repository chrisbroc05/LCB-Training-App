import Link from "next/link";
import { TWELVE_WEEK_PROGRAM_NAME } from "@/lib/twelve-week-program";

export default function UpgradePricingSection() {
  return (
    <section className="mt-8">
      <article className="rounded-2xl border border-[#52B788]/40 bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{TWELVE_WEEK_PROGRAM_NAME}</h2>
        <p className="mt-3 text-zinc-300">
          Unlimited submissions, full Playbook access, workout programs, and weekly check-in calls
          with Coach Broc.
        </p>
        <Link
          href="/program"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          View Program Details
        </Link>
      </article>
    </section>
  );
}
