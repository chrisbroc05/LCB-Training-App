"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminDrillPicker from "@/app/components/admin/AdminDrillPicker";
import { formatDateTime } from "@/lib/format-date";
import { REPORT_RECOMMENDED_FIX_IT_OPTIONS } from "@/lib/player-evaluation-cta-shared";
import {
  parseWrittenReportPaste,
  type WrittenReportSections,
} from "@/lib/written-report-parse-shared";

type QuickReportListItem = {
  id: string;
  playerName: string;
  createdAt: string;
  userEmail: string;
  reviewTrack: string;
  poolLabel: string | null;
  levelLabel: string;
  organizationName: string | null;
  teamName: string | null;
};

function EditableSectionList(props: {
  label: string;
  lines: string[];
  onChange: (lines: string[]) => void;
}) {
  const value = props.lines.join("\n");
  return (
    <label className="block text-sm text-zinc-300">
      {props.label}
      <textarea
        value={value}
        onChange={(event) =>
          props.onChange(
            event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
        rows={Math.max(3, props.lines.length + 1)}
        className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 font-mono text-xs text-zinc-100"
      />
    </label>
  );
}

export default function AdminReportsPendingPanel(props: { initialSelectedId?: string | null }) {
  const [items, setItems] = useState<QuickReportListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(props.initialSelectedId ?? null);
  const [loading, setLoading] = useState(false);
  const [paste, setPaste] = useState("");
  const [sections, setSections] = useState<WrittenReportSections | null>(null);
  const [parseError, setParseError] = useState("");
  const [libraryDrillIds, setLibraryDrillIds] = useState<string[]>([]);
  const [recommendedFixItSlug, setRecommendedFixItSlug] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/reports");
    setLoading(false);
    if (!response.ok) {
      setItems([]);
      return;
    }
    const data = (await response.json()) as { submissions: QuickReportListItem[] };
    setItems(data.submissions);
    setSelectedId((current) => {
      const preferred = current ?? props.initialSelectedId ?? null;
      if (preferred && data.submissions.some((item) => item.id === preferred)) {
        return preferred;
      }
      return data.submissions[0]?.id ?? null;
    });
  }, [props.initialSelectedId]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    setPaste("");
    setSections(null);
    setParseError("");
    setLibraryDrillIds([]);
    setRecommendedFixItSlug("");
    setSendError("");
  }, [selectedId]);

  const handleParse = () => {
    const result = parseWrittenReportPaste(paste);
    if (!result.ok) {
      setSections(null);
      setParseError(result.error);
      return;
    }
    setSections(result.sections);
    setParseError("");
  };

  const handleSend = async () => {
    if (!selectedId || !sections) {
      setSendError("Parse the report and fix any errors before sending.");
      return;
    }

    setSending(true);
    setSendError("");
    const response = await fetch(`/api/admin/reports/${selectedId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paste,
        sections,
        libraryDrillIds,
        recommendedFixItSlug: recommendedFixItSlug || null,
      }),
    });
    setSending(false);

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setSendError(data.error ?? "Unable to send report.");
      return;
    }

    setPaste("");
    setSections(null);
    setLibraryDrillIds([]);
    await loadQueue();
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div>
        <p className="text-sm font-semibold text-zinc-100">Queue (oldest first)</p>
        {loading ? <p className="mt-3 text-sm text-zinc-400">Loading...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">No pending written reports.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-[#22c55e]/60 bg-[#22c55e]/10"
                      : "border-[#2b3650] bg-black/30 hover:border-[#3c4a68]"
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-100">{item.playerName}</p>
                  <p className="mt-1 text-xs text-zinc-400">{formatDateTime(item.createdAt)}</p>
                  <p className="mt-2 text-xs text-zinc-300">
                    {item.poolLabel ?? item.levelLabel}
                    {item.organizationName ? ` | ${item.organizationName}` : ""}
                    {item.teamName ? ` | ${item.teamName}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{item.userEmail}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        {!selected ? (
          <p className="text-sm text-zinc-400">Select a submission from the queue.</p>
        ) : (
          <div className="space-y-4 rounded-xl border border-[#2b3650] bg-black/30 p-4">
            <div>
              <p className="text-sm font-semibold text-zinc-100">{selected.playerName}</p>
              <p className="mt-1 text-xs text-zinc-400">{selected.userEmail}</p>
            </div>

            <label className="block text-sm text-zinc-300">
              Paste report
              <textarea
                value={paste}
                onChange={(event) => setPaste(event.target.value)}
                rows={12}
                placeholder={`STRENGTHS:\n...\n\nAREAS TO IMPROVE:\n...\n\nRECOMMENDED DRILLS:\n...\n\nNOTE FROM COACH BROC:\n...`}
                className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 font-mono text-xs text-zinc-100"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleParse}
                className="rounded-full border border-[#52B788]/50 px-4 py-2 text-sm font-semibold text-[#52B788]"
              >
                Parse and preview
              </button>
            </div>

            {parseError ? <p className="text-sm text-red-300">{parseError}</p> : null}

            {sections ? (
              <div className="space-y-4 border-t border-[#2b3650] pt-4">
                <EditableSectionList
                  label="Strengths"
                  lines={sections.strengths}
                  onChange={(lines) => setSections({ ...sections, strengths: lines })}
                />
                <EditableSectionList
                  label="Areas to improve"
                  lines={sections.areasToImprove}
                  onChange={(lines) => setSections({ ...sections, areasToImprove: lines })}
                />
                <EditableSectionList
                  label="Recommended drills"
                  lines={sections.recommendedDrills}
                  onChange={(lines) => setSections({ ...sections, recommendedDrills: lines })}
                />
                <label className="block text-sm text-zinc-300">
                  Note from Coach Broc
                  <textarea
                    value={sections.noteFromCoach}
                    onChange={(event) =>
                      setSections({ ...sections, noteFromCoach: event.target.value })
                    }
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>

                <AdminDrillPicker
                  title="Library drills (optional)"
                  description="Attach up to 2 drills that unlock in the app for this player."
                  maxSelectable={2}
                  selectedIds={libraryDrillIds}
                  onChange={setLibraryDrillIds}
                />

                <label className="block text-sm text-zinc-300">
                  Recommended Fix-It plan (optional)
                  <select
                    value={recommendedFixItSlug}
                    onChange={(event) => setRecommendedFixItSlug(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
                  >
                    {REPORT_RECOMMENDED_FIX_IT_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void handleSend()}
                  className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send report and PDF"}
                </button>
              </div>
            ) : null}

            {sendError ? <p className="text-sm text-red-300">{sendError}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
