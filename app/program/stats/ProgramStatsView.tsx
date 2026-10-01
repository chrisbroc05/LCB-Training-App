"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CARD =
  "mobile-card rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-sm";

type StatsPayload = {
  totals: {
    games: number;
    atBats: number;
    hits: number;
    doubles: number;
    triples: number;
    homeRuns: number;
    walks: number;
    hitByPitch: number;
    runs: number;
    rbis: number;
    strikeouts: number;
    stolenBases: number;
    errors: number;
    avg: string;
    obp: string;
    slg: string;
  };
  gameLogs: Array<{
    id: string;
    programDay: number;
    note: string;
    opponent: string | null;
    line: string;
    summary: string;
    dateLabel: string;
    weekdayShort: string;
  }>;
};

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#2b3650] bg-black/30 px-3 py-3 text-center">
      <p className="text-xs font-bold tracking-wide text-[#52B788]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

export default function ProgramStatsView() {
  const [payload, setPayload] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const response = await fetch("/api/program/stats");
      const data = (await response.json().catch(() => ({}))) as StatsPayload & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to load stats.");
        setLoading(false);
        return;
      }
      setPayload(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className={`${CARD} text-sm text-zinc-400`}>Loading stats...</div>;
  }

  if (error || !payload) {
    return <div className={`${CARD} text-sm text-red-300`}>{error || "Unable to load stats."}</div>;
  }

  const { totals, gameLogs } = payload;

  return (
    <div className="space-y-4">
      <section className={CARD}>
        <Link href="/dashboard/today" className="text-sm font-semibold text-[#52B788]">
          Back to Today
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-100">My Stats</h1>
      </section>

      <section className={`${CARD} grid grid-cols-2 gap-3 sm:grid-cols-4`}>
        <StatBlock label="G" value={totals.games} />
        <StatBlock label="AB" value={totals.atBats} />
        <StatBlock label="H" value={totals.hits} />
        <StatBlock label="2B" value={totals.doubles} />
        <StatBlock label="3B" value={totals.triples} />
        <StatBlock label="HR" value={totals.homeRuns} />
        <StatBlock label="BB" value={totals.walks} />
        <StatBlock label="HBP" value={totals.hitByPitch} />
        <StatBlock label="R" value={totals.runs} />
        <StatBlock label="RBI" value={totals.rbis} />
        <StatBlock label="K" value={totals.strikeouts} />
        <StatBlock label="SB" value={totals.stolenBases} />
        <StatBlock label="E" value={totals.errors} />
        <StatBlock label="AVG" value={totals.avg} />
        <StatBlock label="OBP" value={totals.obp} />
        <StatBlock label="SLG" value={totals.slg} />
      </section>

      <section className={`${CARD} space-y-3`}>
        <h2 className="text-lg font-semibold text-zinc-100">Game log</h2>
        {gameLogs.length === 0 ? (
          <p className="text-sm text-zinc-400">No games logged yet.</p>
        ) : (
          gameLogs.map((log) => (
            <article key={log.id} className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-100">
                  {log.dateLabel}
                  {log.opponent ? ` vs ${log.opponent}` : ""}
                </p>
                {log.weekdayShort ? (
                  <p className="text-xs text-zinc-500">{log.weekdayShort}</p>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold text-[#9df3bd]">{log.line}</p>
              <p className="mt-2 text-sm text-zinc-400">{log.note}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
