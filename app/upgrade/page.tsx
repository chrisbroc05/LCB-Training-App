import UpgradeActions from "@/app/upgrade/UpgradeActions";

type UpgradePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reason = typeof resolvedSearchParams.reason === "string" ? resolvedSearchParams.reason : "";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-3xl font-semibold text-zinc-100">Keep Training Momentum</h1>
        <p className="mt-2 text-zinc-300">
          Upgrade to unlock more support and continue your development with LCB Training.
        </p>
        {reason === "free-submission-used" && (
          <p className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            Your one free submission has been used. Choose Basic or Pro below to continue.
          </p>
        )}
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6">
          <h2 className="text-2xl font-semibold text-zinc-100">Basic</h2>
          <p className="mt-2 text-2xl font-bold text-[#98b144]">$5 / month</p>
          <p className="mt-3 text-zinc-300">
            Get full access to the training library and mindset content.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-200">
            <li>Full hitting video library</li>
            <li>Full fielding video library</li>
            <li>Mindset video library</li>
          </ul>
          <UpgradeActions tier="BASIC" />
        </article>

        <article className="rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-6">
          <h2 className="text-2xl font-semibold text-zinc-100">Pro</h2>
          <p className="mt-2 text-2xl font-bold text-[#98b144]">$15 / month</p>
          <p className="mt-3 text-zinc-200">
            Everything in Basic plus unlimited personalized support and feedback.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-100">
            <li>Everything in Basic</li>
            <li>Unlimited swing analysis submissions</li>
            <li>Unlimited mental game support submissions</li>
          </ul>
          <UpgradeActions tier="PRO" />
        </article>
      </section>
    </div>
  );
}
