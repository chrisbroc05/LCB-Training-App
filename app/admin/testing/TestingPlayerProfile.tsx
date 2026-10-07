"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMetricValue, type TestMetricRecord } from "@/lib/testing-shared";

type PlayerProfile = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    age: number | null;
    positions: string[];
    bats: string | null;
    throws: string | null;
    parentEmail: string | null;
    claimCode: string;
  };
  teams: Array<{ id: string; name: string; season: string }>;
  linkedUser: { id: string; name: string | null; email: string | null } | null;
  linkedWaiver: { id: string; signedAt: string; teamName: string | null } | null;
  personalBests: Record<
    string,
    { best: number; sessionDate: string; sessionLabel: string } | null
  >;
  historyByMetric: Record<string, Array<{ date: string; label: string; best: number | null }>>;
  metrics: TestMetricRecord[];
  results: Array<{
    id: string;
    sessionDate: string;
    sessionLabel: string;
    teamName: string;
    metricKey: string;
    metricLabel: string;
    metricUnit: string;
    metricDecimals: number;
    metricInputType: string;
    best: number | null;
    absent: boolean;
    skipped: boolean;
  }>;
};

function MetricChart({
  metric,
  points,
}: {
  metric: TestMetricRecord;
  points: Array<{ date: string; label: string; best: number | null }>;
}) {
  const valid = points.filter((point) => point.best !== null) as Array<{
    date: string;
    label: string;
    best: number;
  }>;
  if (valid.length < 2) {
    return <p className="mt-2 text-xs text-zinc-500">Not enough data for a chart yet.</p>;
  }

  const width = 280;
  const height = 80;
  const values = valid.map((point) => point.best);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = valid
    .map((point, index) => {
      const x = (index / (valid.length - 1)) * width;
      const y = height - ((point.best - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-20 w-full max-w-sm">
      <polyline fill="none" stroke="#52B788" strokeWidth="2" points={coords} />
    </svg>
  );
}

export default function TestingPlayerProfile({ playerId }: { playerId: string }) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch(`/api/admin/testing/players/${playerId}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as PlayerProfile & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to load player.");
        return;
      }
      setProfile(data);
    }
    void loadProfile();
  }, [playerId]);

  if (!profile) {
    return <p className="text-sm text-zinc-400">Loading player...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/testing" className="text-sm text-zinc-400 hover:text-zinc-200">
          Back to testing
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
          {profile.player.firstName} {profile.player.lastName}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Claim code: {profile.player.claimCode}
          {profile.player.age ? ` | Age ${profile.player.age}` : ""}
        </p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Profile</h2>
        <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
          <p>Teams: {profile.teams.map((team) => team.name).join(", ") || "None"}</p>
          <p>Bats/Throws: {profile.player.bats ?? "--"} / {profile.player.throws ?? "--"}</p>
          <p>Parent email: {profile.player.parentEmail ?? "None"}</p>
          <p>
            Linked account:{" "}
            {profile.linkedUser
              ? `${profile.linkedUser.name ?? "User"} (${profile.linkedUser.email ?? "no email"})`
              : "None"}
          </p>
          <p>
            Linked waiver:{" "}
            {profile.linkedWaiver
              ? `${profile.linkedWaiver.teamName ?? "Team"} (${profile.linkedWaiver.signedAt.slice(0, 10)})`
              : "None"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Personal bests</h2>
        <div className="mt-3 space-y-4">
          {profile.metrics
            .filter((metric) => metric.active)
            .map((metric) => {
              const best = profile.personalBests[metric.key];
              const history = profile.historyByMetric[metric.key] ?? [];
              return (
                <div key={metric.key} className="rounded-xl border border-[#2b3650] px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-100">{metric.label}</p>
                    <p className="text-sm text-[#52B788]">
                      {best ? formatMetricValue(metric, best.best) : "--"}
                    </p>
                  </div>
                  <MetricChart metric={metric} points={history} />
                </div>
              );
            })}
        </div>
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">All results</h2>
        <div className="mt-3 space-y-2">
          {profile.results.map((result) => (
            <div
              key={result.id}
              className="rounded-xl border border-[#2b3650] px-4 py-3 text-sm text-zinc-300"
            >
              <p className="font-semibold text-zinc-100">
                {result.metricLabel} | {result.sessionLabel}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {result.sessionDate} | {result.teamName}
              </p>
              <p className="mt-1">
                {result.absent
                  ? "Absent"
                  : result.skipped
                    ? "Skipped"
                    : result.best === null
                      ? "--"
                      : formatMetricValue(
                          {
                            decimals: result.metricDecimals,
                            unit: result.metricUnit,
                            inputType:
                              result.metricInputType === "feet_inches" ? "feet_inches" : "number",
                          },
                          result.best,
                        )}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
