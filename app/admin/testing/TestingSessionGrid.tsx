"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatMetricValue,
  METRICS_EXCLUDED_FROM_RANKINGS,
  type TestMetricRecord,
  type TestPlayerSummary,
  type TestResultRecord,
} from "@/lib/testing-shared";

type GridData = {
  session: {
    id: string;
    teamId: string;
    teamName: string;
    date: string;
    label: string;
    notes: string | null;
  };
  metrics: TestMetricRecord[];
  players: TestPlayerSummary[];
  results: Record<string, TestResultRecord>;
};

export default function TestingSessionGrid({
  teamId,
  sessionId,
}: {
  teamId: string;
  sessionId: string;
}) {
  const [grid, setGrid] = useState<GridData | null>(null);
  const [sortMetricKey, setSortMetricKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGrid() {
      const response = await fetch(`/api/admin/testing/sessions/${sessionId}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as GridData & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to load session results.");
        return;
      }
      setGrid(data);
    }
    void loadGrid();
  }, [sessionId]);

  const sortedPlayers = useMemo(() => {
    if (!grid) {
      return [];
    }
    const players = [...grid.players];
    if (!sortMetricKey || METRICS_EXCLUDED_FROM_RANKINGS.has(sortMetricKey)) {
      return players;
    }
    const metric = grid.metrics.find((entry) => entry.key === sortMetricKey);
    if (!metric) {
      return players;
    }
    return players.sort((a, b) => {
      const aResult = grid.results[`${a.id}:${sortMetricKey}`];
      const bResult = grid.results[`${b.id}:${sortMetricKey}`];
      const aBest = aResult?.best;
      const bBest = bResult?.best;
      if (aBest === null || aBest === undefined) {
        return 1;
      }
      if (bBest === null || bBest === undefined) {
        return -1;
      }
      return metric.betterIs === "LOWER" ? aBest - bBest : bBest - aBest;
    });
  }, [grid, sortMetricKey]);

  if (!grid) {
    return <p className="text-sm text-zinc-400">Loading results...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/admin/testing/teams/${teamId}`}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Back to team
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-100">{grid.session.label}</h1>
          <p className="text-sm text-zinc-400">
            {grid.session.teamName} | {grid.session.date}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/testing/teams/${teamId}/sessions/${sessionId}/entry`}
            className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0A1628]"
          >
            Enter data
          </Link>
          <a
            href={`/api/admin/testing/sessions/${sessionId}/export`}
            className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Export CSV
          </a>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="overflow-x-auto rounded-3xl border border-[#18243a] bg-[#0b1324]/80">
        <table className="min-w-full text-left text-xs text-zinc-300">
          <thead>
            <tr className="border-b border-[#2b3650]">
              <th className="px-3 py-3">Player</th>
              {grid.metrics.map((metric) => (
                <th key={metric.key} className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setSortMetricKey(metric.key)}
                    className="font-semibold text-zinc-200 hover:text-[#52B788]"
                  >
                    {metric.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.id} className="border-b border-[#2b3650]/60">
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/testing/players/${player.id}`}
                    className="font-semibold text-zinc-100 hover:text-[#52B788]"
                  >
                    {player.firstName} {player.lastName}
                  </Link>
                </td>
                {grid.metrics.map((metric) => {
                  const result = grid.results[`${player.id}:${metric.key}`];
                  let value = "--";
                  if (result?.absent) {
                    value = "Absent";
                  } else if (result?.skipped) {
                    value = "Skip";
                  } else if (result?.best !== null && result?.best !== undefined) {
                    value = formatMetricValue(metric, result.best);
                  }
                  return (
                    <td key={`${player.id}-${metric.key}`} className="px-3 py-3">
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
