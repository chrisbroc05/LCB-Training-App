import UpgradeActions from "@/app/upgrade/UpgradeActions";
import {
  TWELVE_WEEK_PROGRAM_NAME,
  TWELVE_WEEK_PROGRAM_PRICE_LABEL,
} from "@/lib/twelve-week-program";

export default function UpgradePricingSection() {
  return (
    <section className="mt-8">
      <article className="rounded-2xl border-2 border-[#52B788]/50 bg-[#0b1324]/90 p-5 shadow-lg shadow-[#52B788]/10 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#52B788]">Recommended</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-100 sm:text-3xl">
          {TWELVE_WEEK_PROGRAM_NAME}
        </h2>
        <p className="mt-2 text-xl font-bold text-[#98b144]">{TWELVE_WEEK_PROGRAM_PRICE_LABEL} one-time</p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
          Unlimited coaching submissions, full Playbook access, workout programs, weekly check-in
          calls with Coach Broc, and a structured 12-week daily training plan.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-200">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
            <span>Daily Today screen with drills, workouts, and mindset prompts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
            <span>Personal feedback on swing analysis and mental game submissions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
            <span>Full drill library, resources, and recruiting guide included</span>
          </li>
        </ul>
        <UpgradeActions tier="TWELVE_WEEK" buttonLabel="Join the 12-Week Program" />
      </article>
    </section>
  );
}
