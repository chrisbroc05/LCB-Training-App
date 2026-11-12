"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import DailyLeaderboardNotice from "@/app/dashboard/DailyLeaderboardNotice";
import {
  formatDailyLeaderboardEntryPrimary,
  formatDailyLeaderboardStats,
  type DailyLeaderboardEntry,
  type DailyLeaderboardPayload,
  type DailyLeaderboardScopeFilter,
} from "@/lib/daily-challenge-shared";

type FilterTab = {
  scope: DailyLeaderboardScopeFilter;
  label: string;
};

export default function DailyLeaderboardPage() {
  const [summary, setSummary] = useState<DailyLeaderboardPayload | null>(null);
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [scope, setScope] = useState<DailyLeaderboardScopeFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextScope: DailyLeaderboardScopeFilter) => {
    setLoading(true);
    setError(null);
    const response = await fetch(
      `/api/daily-challenge/leaderboard?scope=${encodeURIComponent(nextScope)}`,
      { cache: "no-store" },
    );
    const data = (await response.json().catch(() => ({}))) as {
      summary?: DailyLeaderboardPayload;
      entries?: DailyLeaderboardEntry[];
      error?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Couldn't load leaderboard.");
      setSummary(null);
      setEntries([]);
      setLoading(false);
      return;
    }
    const nextSummary = data.summary ?? null;
    setSummary(nextSummary);
    setEntries(data.entries ?? nextSummary?.entries ?? []);
    if (nextSummary?.scope) {
      setScope(nextSummary.scope);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load("all");
  }, [load]);

  const tabs: FilterTab[] = [
    { scope: "all", label: "All" },
    {
      scope: "age",
      label: summary?.ageGroupFilterLabel ?? "My age group",
    },
    ...(summary?.canFilterByOrg
      ? [
          {
            scope: "org" as const,
            label: summary.organizationName?.trim() || "My club",
          },
        ]
      : []),
  ];

  const onSelectScope = (nextScope: DailyLeaderboardScopeFilter) => {
    setScope(nextScope);
    void load(nextScope);
  };

  return (
    <div className="mobile-card-stack px-4 pb-28 pt-2 md:mx-auto md:max-w-3xl md:px-6 md:pb-10 md:pt-6">
      <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-200">
        Back to home
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-100">LCB Leaderboard</h1>
      {summary ? (
        <p className="mt-1 text-sm text-zinc-400">
          {summary.scopeLabel} - {summary.monthKey} - resets on the 1st
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = scope === tab.scope;
          return (
            <button
              key={tab.scope}
              type="button"
              onClick={() => onSelectScope(tab.scope)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-[#52B788] text-[#0A1628]"
                  : "border border-[#2b3650] bg-[#0b1324] text-zinc-300 hover:border-[#52B788]/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {loading && !error ? <p className="mt-4 text-sm text-zinc-400">Loading...</p> : null}
      {!loading && !error && entries.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">Be the first on the board this month.</p>
      ) : null}

      <ul className="mt-6 space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.userId}
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              entry.isSelf
                ? "border-[#52B788]/50 bg-[#22c55e]/10 font-semibold text-[#9df3bd]"
                : "border-[#18243a] text-zinc-200"
            }`}
          >
            <span>
              #{entry.rank} {formatDailyLeaderboardEntryPrimary(entry)}
            </span>
            <span className="shrink-0 text-zinc-400">
              {formatDailyLeaderboardStats(entry.completedThisMonth, entry.streak)}
            </span>
          </li>
        ))}
      </ul>

      {summary?.self ? (
        <p className="mt-4 text-sm font-semibold text-[#9df3bd]">
          You&apos;re #{summary.self.rank}
        </p>
      ) : null}

      {summary ? (
        <DailyLeaderboardNotice notice={summary.viewerNotice} className="mt-4 text-sm text-zinc-400" />
      ) : null}
    </div>
  );
}
