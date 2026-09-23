import Link from "next/link";
import UpgradePricingSection from "@/app/upgrade/UpgradePricingSection";
import { membershipTiers } from "@/lib/membership";

const freeTier = membershipTiers.find((tier) => tier.key === "free")!;

type UpgradePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reason = typeof resolvedSearchParams.reason === "string" ? resolvedSearchParams.reason : "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Keep Training Momentum</h1>
        <p className="mt-2 text-zinc-300">
          Join the 12-Week Coaching Program to unlock full coaching support and training resources.
        </p>
        {reason === "free-submission-used" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Your one free submission has been used. Join the 12-Week Coaching Program to continue.
          </p>
        )}
        {reason === "basic-required" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Basic membership ($59 one-time) unlocks lifetime access to the full LCB Training content
            library, drill library, 8 workout programs, and bonus resources.
          </p>
        )}
        {reason === "playbook" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Unlock The Next Level Playbook and all four chapters with a one-time Basic
            membership ($59), or get full Playbook access with the 12-Week Coaching Program.
          </p>
        )}
        {(reason === "memorable-required" ||
          reason === "pro-required" ||
          reason === "elite-required") && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            The 12-Week Coaching Program includes coaching submissions, accountability check-ins,
            and personal feedback from Coach Broc.
          </p>
        )}
        <p className="mt-4 text-sm text-zinc-300">
          <span className="font-semibold text-[#9df3bd]">Free</span> includes a Player Assessment
          Call, one coaching submission with personal feedback, and no credit card required.{" "}
          <span className="font-semibold text-[#9df3bd]">Basic</span> is a $59 one-time purchase with
          lifetime access to the full content library. The{" "}
          <span className="font-semibold text-[#9df3bd]">12-Week Coaching Program</span> includes
          unlimited submissions, full Playbook access, workout programs, and weekly check-in calls.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-100">{freeTier.name}</h2>
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
      </section>

      <UpgradePricingSection />

      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Not ready for the full program?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Start with a standalone Playbook purchase or book a single remote session.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/auth?tier=basic"
            className="inline-flex items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
          >
            Unlock The Playbook -- $59
          </Link>
          <Link
            href="/remote"
            className="inline-flex items-center justify-center rounded-full border border-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
          >
            Book a Remote Session -- $60
          </Link>
        </div>
      </section>
    </div>
  );
}
