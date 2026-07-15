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
          Upgrade to unlock more support and continue your development with LCB Training.
        </p>
        {reason === "free-submission-used" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Your one free submission has been used. Choose Basic, Memorable, or Elite below to continue.
          </p>
        )}
        {reason === "basic-required" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Basic membership unlocks the full drill library, all 7 workout programs, and the
            Pre-Game Warmup and Baseball Athlete Nutrition guides.
          </p>
        )}
        {(reason === "memorable-required" || reason === "pro-required") && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Memorable or Elite membership is required for coaching submissions, accountability
            check-ins, and coaching PDF resources.
          </p>
        )}
        <p className="mt-4 text-sm text-zinc-300">
          <span className="font-semibold text-[#9df3bd]">Free</span> includes one coaching
          submission, a 20-minute Player Assessment Call, and personal feedback from Coach Broc.
          <span className="ml-1 font-semibold text-[#9df3bd]">Basic</span> is self-guided with the full
          drill library, resources, and PDF guides.
          <span className="ml-1 font-semibold text-[#9df3bd]">Memorable</span> adds 2 coaching
          submissions per month with 48-hour feedback, accountability check-ins, and coaching PDFs.
          <span className="ml-1 font-semibold text-[#9df3bd]">Elite</span> adds priority 24-hour
          response, 4 submissions with rollover, group coaching calls, and personalized training
          plans.
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
    </div>
  );
}
