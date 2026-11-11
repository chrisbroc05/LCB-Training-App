"use client";

import { useState } from "react";
import {
  adminFetchJson,
  ADMIN_FETCH_COULD_NOT_LOAD_JSON,
} from "@/lib/admin-fetch-shared";
import type { DailyChallengeCsvPreview } from "@/lib/daily-challenge-csv-shared";
import { dailyChallengeAgeGroupLabel } from "@/lib/daily-challenge-shared";

type PreviewSuccess = Extract<DailyChallengeCsvPreview, { ok: true }>;

type CommitResult = {
  challengesUpserted: number;
  questionsUpserted: number;
  warnings: string[];
};

export default function AdminDailyChallengeCsvImportPanel() {
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

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
        "/api/admin/daily-challenges/import/preview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text }),
        },
        {
          context: "daily-challenge-import-preview",
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
        "/api/admin/daily-challenges/import/commit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText }),
        },
        {
          context: "daily-challenge-import-commit",
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
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {commitResult ? (
        <p className="rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#9df3bd]">
          Imported {commitResult.challengesUpserted} challenge
          {commitResult.challengesUpserted === 1 ? "" : "s"} and{" "}
          {commitResult.questionsUpserted} question
          {commitResult.questionsUpserted === 1 ? "" : "s"}.
        </p>
      ) : null}

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Upload</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Columns: kind (challenge|question), age_group (8-11|12-14|15+|all), rotation_day,
          title_or_prompt, instructions (challenges), question_type (TRIVIA|MINDSET),
          option_1..option_4, correct_option (1-based), explanation, drill_library_vimeo_id,
          active.
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
          {preview.warnings.length > 0 ? (
            <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
              <h2 className="text-lg font-semibold text-amber-100">Warnings</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">
              Challenges ({preview.challenges.length})
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Age</th>
                    <th className="px-2 py-2">Day</th>
                    <th className="px-2 py-2">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.challenges.map((row) => (
                    <tr key={`c-${row.lineNumber}`} className="border-t border-[#1c2740]">
                      <td className="px-2 py-2">{dailyChallengeAgeGroupLabel(row.ageGroup)}</td>
                      <td className="px-2 py-2">{row.rotationDay}</td>
                      <td className="px-2 py-2 text-zinc-100">{row.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
            <h2 className="text-lg font-semibold text-zinc-100">
              Questions ({preview.questions.length})
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Age</th>
                    <th className="px-2 py-2">Day</th>
                    <th className="px-2 py-2">Prompt</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.questions.map((row) => (
                    <tr key={`q-${row.lineNumber}`} className="border-t border-[#1c2740]">
                      <td className="px-2 py-2">{row.type}</td>
                      <td className="px-2 py-2">
                        {row.ageGroup ? dailyChallengeAgeGroupLabel(row.ageGroup) : "All"}
                      </td>
                      <td className="px-2 py-2">{row.rotationDay}</td>
                      <td className="px-2 py-2 text-zinc-100">{row.prompt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmImport()}
            className="rounded-full bg-[#52B788] px-5 py-2.5 text-sm font-semibold text-[#0A1628]"
          >
            Confirm import
          </button>
        </>
      ) : null}
    </div>
  );
}
