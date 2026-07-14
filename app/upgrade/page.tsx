import UpgradePricingSection from "@/app/upgrade/UpgradePricingSection";

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
            Your one free submission has been used. Choose Basic, Pro, or Elite below to continue.
          </p>
        )}
        {reason === "basic-required" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Basic membership unlocks the full drill library and all 9 downloadable workout programs.
          </p>
        )}
        {reason === "pro-required" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Pro or Elite membership is required for swing analysis and mental game support submissions.
          </p>
        )}
        <p className="mt-4 text-sm text-zinc-300">
          <span className="font-semibold text-[#9df3bd]">Basic</span> unlocks the full drill library and workout programs.
          <span className="ml-1 font-semibold text-[#9df3bd]">Pro</span> and
          <span className="ml-1 font-semibold text-[#9df3bd]">Elite</span> include unlimited swing
          analysis and mental game support.
        </p>
      </section>

      <UpgradePricingSection />
    </div>
  );
}
