"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  parseCsvText,
  type TestMetricRecord,
  type TestSessionSummary,
} from "@/lib/testing-shared";

type TeamDetail = {
  team: {
    id: string;
    name: string;
    teamSlug: string;
  };
  sessions: TestSessionSummary[];
};

export default function TestingTeamPanel({ teamId }: { teamId: string }) {
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [metrics, setMetrics] = useState<TestMetricRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [importDate, setImportDate] = useState("");
  const [importLabel, setImportLabel] = useState("");
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    playerName: "",
    age: "",
  });
  const [previewRows, setPreviewRows] = useState<
    Array<{
      rowIndex: number;
      playerName: string;
      firstName: string;
      lastName: string;
      age: number | null;
      metrics: Record<string, number | null>;
      matchPlayerId: string | null;
      matchLabel: "existing" | "new";
    }>
  >([]);

  async function loadDetail() {
    setError(null);
    const [teamResponse, metricsResponse] = await Promise.all([
      fetch(`/api/admin/testing/teams/${teamId}`, { cache: "no-store" }),
      fetch("/api/admin/testing/metrics", { cache: "no-store" }),
    ]);
    const teamData = (await teamResponse.json()) as TeamDetail & { error?: string };
    const metricsData = (await metricsResponse.json()) as { metrics?: TestMetricRecord[] };
    if (!teamResponse.ok) {
      throw new Error(teamData.error ?? "Failed to load team.");
    }
    setDetail(teamData);
    setMetrics(metricsData.metrics ?? []);
  }

  useEffect(() => {
    void loadDetail().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load team.");
    });
  }, [teamId]);

  const csvHeaders = useMemo(() => {
    if (!csvText.trim()) {
      return [] as string[];
    }
    return parseCsvText(csvText).headers;
  }, [csvText]);

  async function previewImport() {
    const response = await fetch(`/api/admin/testing/teams/${teamId}/import/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText, columnMap }),
    });
    const data = (await response.json()) as {
      preview?: { rows: typeof previewRows };
      error?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Failed to preview import.");
      return;
    }
    setPreviewRows(data.preview?.rows ?? []);
  }

  async function commitImport() {
    const response = await fetch(`/api/admin/testing/teams/${teamId}/import/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionDate: importDate,
        sessionLabel: importLabel,
        rows: previewRows.map((row) => ({
          firstName: row.firstName,
          lastName: row.lastName,
          age: row.age,
          playerId: row.matchPlayerId,
          metrics: row.metrics,
        })),
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Failed to import CSV.");
      return;
    }
    setCsvText("");
    setPreviewRows([]);
    await loadDetail();
  }

  if (!detail) {
    return <p className="text-sm text-zinc-400">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/testing" className="text-sm text-zinc-400 hover:text-zinc-200">
          Back to testing
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">{detail.team.name}</h1>
        <p className="mt-1 text-sm text-zinc-400">CSV import and past session results</p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Past sessions</h2>
        <div className="mt-4 space-y-2">
          {detail.sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2b3650] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-100">{session.label}</p>
                <p className="text-xs text-zinc-400">
                  {session.date} | {session.resultCount} results
                </p>
              </div>
              <Link
                href={`/admin/testing/teams/${teamId}/sessions/${session.id}`}
                className="rounded-full border border-[#2b3650] px-4 py-2 text-xs font-semibold text-zinc-300"
              >
                Results grid
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Import CSV</h2>
        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={6}
          placeholder="Paste CSV here"
          className="mt-4 w-full rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
        />
        {csvHeaders.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-zinc-300">
              Player name column
              <select
                value={columnMap.playerName}
                onChange={(event) =>
                  setColumnMap((current) => ({ ...current, playerName: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-2"
              >
                <option value="">Select column</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-zinc-300">
              Age column
              <select
                value={columnMap.age}
                onChange={(event) =>
                  setColumnMap((current) => ({ ...current, age: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-2"
              >
                <option value="">Select column</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
            {metrics.map((metric) => (
              <label key={metric.key} className="text-sm text-zinc-300">
                {metric.label}
                <select
                  value={columnMap[metric.key] ?? ""}
                  onChange={(event) =>
                    setColumnMap((current) => ({ ...current, [metric.key]: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0a1628] px-3 py-2"
                >
                  <option value="">Skip</option>
                  {csvHeaders.map((header) => (
                    <option key={`${metric.key}-${header}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            type="date"
            value={importDate}
            onChange={(event) => setImportDate(event.target.value)}
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100"
          />
          <input
            value={importLabel}
            onChange={(event) => setImportLabel(event.target.value)}
            placeholder="Session label"
            className="rounded-xl border border-[#2b3650] bg-[#0a1628] px-4 py-3 text-sm text-zinc-100 sm:col-span-2"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void previewImport()}
            className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => void commitImport()}
            disabled={previewRows.length === 0}
            className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0A1628] disabled:opacity-50"
          >
            Save import
          </button>
        </div>
      </section>
    </div>
  );
}
