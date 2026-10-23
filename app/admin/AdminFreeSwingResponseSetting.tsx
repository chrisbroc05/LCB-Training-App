"use client";

import { useCallback, useEffect, useState } from "react";
import { FREE_SWING_ANALYSIS_RESPONSE_OPTIONS } from "@/lib/free-swing-analysis-response-shared";
import type { FreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-shared";

export default function AdminFreeSwingResponseSetting() {
  const [mode, setMode] = useState<FreeSwingAnalysisResponseMode>("VIDEO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/coaching-settings");
    setLoading(false);
    if (!response.ok) {
      setError("Unable to load coaching settings.");
      return;
    }
    const data = (await response.json()) as { freeSwingAnalysisResponseMode?: FreeSwingAnalysisResponseMode };
    if (data.freeSwingAnalysisResponseMode) {
      setMode(data.freeSwingAnalysisResponseMode);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    const response = await fetch("/api/admin/coaching-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freeSwingAnalysisResponseMode: mode }),
    });
    setSaving(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Unable to save.");
      return;
    }
    setSaved(true);
  };

  return (
    <section className="mb-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Coaching settings</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Free swing analyses use the Submissions inbox for video responses by default. Switch to
        written reports to route them through Reports.
      </p>
      {loading ? <p className="mt-4 text-sm text-zinc-500">Loading...</p> : null}
      {!loading ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm text-zinc-300">
            Free swing analysis response
            <select
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as FreeSwingAnalysisResponseMode);
                setSaved(false);
              }}
              className="mt-2 w-full max-w-md rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
            >
              {FREE_SWING_ANALYSIS_RESPONSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      ) : null}
      {saved ? <p className="mt-2 text-sm text-[#52B788]">Saved.</p> : null}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
