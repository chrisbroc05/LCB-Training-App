import UpgradeActions from "@/app/upgrade/UpgradeActions";

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
        <p className="mt-4 text-sm text-zinc-300">
          <span className="font-semibold text-[#9df3bd]">Basic</span> unlocks the full drill library.
          <span className="ml-1 font-semibold text-[#9df3bd]">Pro</span> and
          <span className="ml-1 font-semibold text-[#9df3bd]">Elite</span> include ongoing swing
          analysis and mental game support.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Basic</h2>
          <p className="mt-2 text-2xl font-bold text-[#98b144]">$5 / month</p>
          <p className="mt-3 text-zinc-300">
            Get full access to the hitting, fielding, and mindset drill libraries.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-200">
            <li>Full hitting video library</li>
            <li>Full fielding video library</li>
            <li>Mindset video library</li>
          </ul>
          <UpgradeActions tier="BASIC" />
        </article>

        <article className="rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Pro</h2>
          <p className="mt-2 text-2xl font-bold text-[#98b144]">$9 / month</p>
          <p className="mt-3 text-zinc-200">
            Everything in Basic plus ongoing personalized swing and mental game support.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-100">
            <li>Everything in Basic</li>
            <li>Ongoing swing analysis submissions</li>
            <li>Ongoing mental game support submissions</li>
          </ul>
          <UpgradeActions tier="PRO" />
        </article>

        <article className="rounded-2xl border border-[#7f9434]/40 bg-[#7f9434]/10 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Elite</h2>
          <p className="mt-2 text-2xl font-bold text-[#98b144]">$14 / month</p>
          <p className="mt-3 text-zinc-200">
            Everything in Pro with top-priority coaching responses and monthly group call access.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-100">
            <li>Everything in Pro</li>
            <li>Priority swing analysis feedback</li>
            <li>Priority mental game feedback</li>
            <li>Monthly live group calls</li>
          </ul>
          <UpgradeActions tier="ELITE" />
        </article>
      </section>
    </div>
  );
}
