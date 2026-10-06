import {
  DEMO_GAME_LOG,
  DEMO_SEASON_STATS,
} from "@/app/admin/social/app-highlight/demo-data";

export default function DemoStatsScreen() {
  return (
    <div className="space-y-3 p-4">
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4">
        <p className="text-[10px] font-bold tracking-wide text-[#52B788]">MY STATS</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Games", DEMO_SEASON_STATS.games],
            ["AVG", DEMO_SEASON_STATS.avg],
            ["OBP", DEMO_SEASON_STATS.obp],
            ["H", DEMO_SEASON_STATS.hits],
            ["RBI", DEMO_SEASON_STATS.rbis],
            ["SB", DEMO_SEASON_STATS.stolenBases],
          ].map(([label, value]) => (
            <div key={label} className="text-center">
              <p className="text-[10px] font-bold text-zinc-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-zinc-100">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-100">Game log</p>
          <span className="rounded-full bg-[#52B788]/15 px-2 py-0.5 text-[10px] font-semibold text-[#52B788]">
            GAME
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-zinc-200">vs {DEMO_GAME_LOG.opponent}</p>
        <p className="mt-1 text-sm text-[#9df3bd]">{DEMO_GAME_LOG.line}</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">{DEMO_GAME_LOG.note}</p>
      </section>
    </div>
  );
}
