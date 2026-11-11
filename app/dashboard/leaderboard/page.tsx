"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatDailyLeaderboardStats,
  type DailyLeaderboardEntry,
  type DailyLeaderboardPayload,
} from "@/lib/daily-challenge-shared";

export default function DailyLeaderboardPage() {
  const [summary, setSummary] = useState<DailyLeaderboardPayload | null>(null);
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/daily-challenge/leaderboard", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        summary?: DailyLeaderboardPayload;
        entries?: DailyLeaderboardEntry[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Couldn't load leaderboard.");
        return;
      }
      setSummary(data.summary ?? null);
      setEntries(data.entries ?? []);
    };
    void load();
  }, []);

  return (
    <div className="mobile-card-stack px-4 pb-28 pt-2 md:mx-auto md:max-w-3xl md:px-6 md:pb-10 md:pt-6">
      <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-200">
        Back to home
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-100">Daily Challenge leaderboard</h1>
      {summary ? (
        <p className="mt-1 text-sm text-zinc-400">
          {summary.scopeLabel} - {summary.monthKey} - resets on the 1st
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {!error && entries.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">Be the first on the board this month.</p>
      ) : null}
      <ul className="mt-6 space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.userId}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
              entry.isSelf
                ? "border-[#52B788]/50 bg-[#22c55e]/10 font-semibold text-[#9df3bd]"
                : "border-[#18243a] text-zinc-200"
            }`}
          >
            <span>
              #{entry.rank} {entry.displayName}
            </span>
            <span className="text-zinc-400">
              {formatDailyLeaderboardStats(entry.completedThisMonth, entry.streak)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
