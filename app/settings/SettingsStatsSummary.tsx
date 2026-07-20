type SettingsStatItem = {
  label: string;
  value: string;
  variant?: "default" | "badge";
};

type SettingsStatsSummaryProps = {
  stats: SettingsStatItem[];
};

export default function SettingsStatsSummary({ stats }: SettingsStatsSummaryProps) {
  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0A1628] p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-[#2b3650] bg-[#0b1324]/80 p-4 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{stat.label}</p>
            {stat.variant === "badge" ? (
              <span className="mt-3 inline-flex rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-sm font-semibold text-[#9df3bd]">
                {stat.value}
              </span>
            ) : (
              <p className="mt-2 text-2xl font-bold text-[#9df3bd]">{stat.value}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
