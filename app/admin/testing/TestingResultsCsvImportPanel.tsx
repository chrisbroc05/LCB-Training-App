"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  adminFetchJson,
  ADMIN_FETCH_COULD_NOT_LOAD_JSON,
} from "@/lib/admin-fetch-shared";
import type { ResultsCsvImportPreview } from "@/lib/testing-results-csv-shared";
import { formatMetricValue } from "@/lib/testing-shared";

type PreviewSuccess = Extract<ResultsCsvImportPreview, { ok: true }>;

type CommitResult = {
  playersCreated: number;
  metricsCreated: number;
  resultsUpserted: number;
  sessionsTouched: number;
};

export default function TestingResultsCsvImportPanel() {
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  const overwriteRows = useMemo(() => {
    if (!preview) {
      return [];
    }
    return preview.rows.filter((row) => row.values.some((value) => value.existingValue !== null));
  }, [preview]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setError(null);
    setCommitResult(null);
    setPreview(null);
    setBusy(true);
    try {
      const text = await file.text();
      setCsvText(text);
      setFileName(file.name);
      const res = await adminFetchJson<{ preview?: PreviewSuccess; error?: string }>(
        "/api/admin/testing/import/preview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text }),
        },
        {
          context: "testing-import-preview",
          okUserMessage: "Couldn't preview CSV import. Try again.",
          notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
        },
      );
      if (!res.ok) {
        setError(res.userMessage);
        return;
      }
      if (!res.data.preview) {
        setError(res.data.error ?? "Couldn't preview CSV import.");
        return;
      }
      setPreview(res.data.preview);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to read CSV.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!csvText) {
      return;
    }
    setBusy(true);
    setError(null);
    setCommitResult(null);
    try {
      const res = await adminFetchJson<{ result?: CommitResult; error?: string }>(
        "/api/admin/testing/import/commit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText }),
        },
        {
          context: "testing-import-commit",
          okUserMessage: "Couldn't import CSV. Try again.",
          notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
        },
      );
      if (!res.ok) {
        setError(res.userMessage);
        return;
      }
      if (!res.data.result) {
        setError(res.data.error ?? "Couldn't import CSV.");
        return;
      }
      setCommitResult(res.data.result);
      setPreview(null);
      setCsvText(null);
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/testing" className="text-sm text-zinc-400 hover:text-zinc-200">
          Back to testing
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Import results from CSV</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Preview first. Nothing is saved until you confirm. Team names must match exactly.
        </p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {commitResult ? (
        <p className="rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#9df3bd]">
          Imported {commitResult.resultsUpserted} result
          {commitResult.resultsUpserted === 1 ? "" : "s"} across {commitResult.sessionsTouched}{" "}
          session{commitResult.sessionsTouched === 1 ? "" : "s"}. Created{" "}
          {commitResult.playersCreated} player{commitResult.playersCreated === 1 ? "" : "s"} and{" "}
          {commitResult.metricsCreated} metric{commitResult.metricsCreated === 1 ? "" : "s"}.
        </p>
      ) : null}

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Upload</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Required columns: team, test_date, first_name, last_name, ten_yard_sec,
          thirty_yard_sec, sixty_yard_sec, shuttle_5_10_5_sec, broad_jump_in, exit_velo_mph,
          pulldown_velo_mph. A jersey column is ignored if present.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={busy}
              onChange={onFileChange}
            />
            {busy ? "Working..." : "Choose CSV"}
          </label>
          {fileName ? <span className="text-sm text-zinc-400">{fileName}</span> : null}
        </div>
      </section>

      {preview ? (
        <>
          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Metric mapping</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">CSV column</th>
                    <th className="px-2 py-2">Metric</th>
                    <th className="px-2 py-2">Station</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.mappings.map((mapping) => (
                    <tr key={mapping.csvColumn} className="border-t border-[#1c2740]">
                      <td className="px-2 py-2 font-mono text-xs text-zinc-400">{mapping.csvColumn}</td>
                      <td className="px-2 py-2 text-zinc-100">
                        {mapping.label}{" "}
                        <span className="text-zinc-500">
                          ({mapping.unit}, {mapping.betterIs === "LOWER" ? "lower better" : "higher better"})
                        </span>
                      </td>
                      <td className="px-2 py-2 text-zinc-300">{mapping.stationLabel}</td>
                      <td className="px-2 py-2">
                        {mapping.exists ? (
                          <span className="text-[#9df3bd]">Existing</span>
                        ) : (
                          <span className="text-amber-300">Will create</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.metricsToCreate.length > 0 ? (
              <p className="mt-3 text-sm text-amber-200">
                Will create {preview.metricsToCreate.length} metric
                {preview.metricsToCreate.length === 1 ? "" : "s"}:{" "}
                {preview.metricsToCreate.map((metric) => metric.label).join(", ")}.
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">All metrics already exist.</p>
            )}
          </section>

          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Players</h2>
            {preview.playersToCreate.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">All players already on the team roster.</p>
            ) : (
              <ul className="mt-3 space-y-1 text-sm text-amber-100">
                {preview.playersToCreate.map((player) => (
                  <li key={`${player.teamName}:${player.firstName}:${player.lastName}`}>
                    Create {player.firstName} {player.lastName} on {player.teamName}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              No app accounts are created and no emails are sent.
            </p>
          </section>

          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Preview rows</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {preview.rows.length} player/date row{preview.rows.length === 1 ? "" : "s"} |{" "}
                  {preview.resultCreateCount} new value{preview.resultCreateCount === 1 ? "" : "s"} |{" "}
                  {preview.resultUpdateCount} overwrite
                  {preview.resultUpdateCount === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmImport()}
                className="rounded-full bg-[#52B788] px-5 py-2 text-sm font-semibold text-[#0A1628] disabled:opacity-60"
              >
                {busy ? "Saving..." : "Confirm import"}
              </button>
            </div>

            {overwriteRows.length > 0 ? (
              <p className="mt-3 text-sm text-amber-200">
                {overwriteRows.length} row{overwriteRows.length === 1 ? "" : "s"} include values that
                already exist for the same player + date + metric (shown as old -&gt; new).
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              {preview.rows.map((row) => (
                <div
                  key={`${row.rowIndex}:${row.teamId}:${row.testDate}:${row.firstName}:${row.lastName}`}
                  className="rounded-xl border border-[#2b3650] px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-100">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {row.teamName} | {row.testDate} |{" "}
                      {row.playerStatus === "create" ? (
                        <span className="text-amber-300">new player</span>
                      ) : (
                        <span className="text-[#9df3bd]">existing</span>
                      )}
                    </p>
                  </div>
                  {row.values.length === 0 ? (
                    <p className="mt-2 text-xs text-zinc-500">No metric values on this row.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                      {row.values.map((value) => {
                        const metric = preview.mappings.find(
                          (mapping) => mapping.metricKey === value.metricKey,
                        );
                        const format = (raw: number) =>
                          metric
                            ? formatMetricValue(metric, raw)
                            : String(raw);
                        return (
                          <li key={value.metricKey}>
                            <span className="text-zinc-400">{value.label}:</span>{" "}
                            {value.existingValue === null ? (
                              <span>{format(value.newValue)}</span>
                            ) : (
                              <span>
                                <span className="text-zinc-500">{format(value.existingValue)}</span>
                                {" -> "}
                                <span className="text-amber-100">{format(value.newValue)}</span>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
