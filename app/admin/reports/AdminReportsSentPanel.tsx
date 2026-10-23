"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminDrillPicker from "@/app/components/admin/AdminDrillPicker";
import {
  fixItSlugToLabel,
  formatTurnaroundDuration,
  type AdminSentReportLevelFilter,
} from "@/lib/admin-sent-reports-shared";
import { formatDateTime } from "@/lib/format-date";
import { REPORT_RECOMMENDED_FIX_IT_OPTIONS } from "@/lib/player-evaluation-cta-shared";
import type { WrittenReportSections } from "@/lib/written-report-parse-shared";

type SentSummary = {
  sentThisWeek: number;
  sentThisMonth: number;
  sentAllTime: number;
  averageTurnaroundMsLast30Days: number | null;
};

type SentReportRow = {
  id: string;
  playerName: string;
  levelLabel: string;
  organizationName: string | null;
  teamName: string | null;
  submittedAt: string;
  sentAt: string | null;
  turnaroundMs: number | null;
  drillCount: number;
  drillTitles: string[];
  recommendedFixItSlug: string | null;
  editCount: number;
  sections: WrittenReportSections;
  libraryDrillIds: string[];
};

type OrgOption = { id: string; name: string };

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

export default function AdminReportsSentPanel() {
  const [summary, setSummary] = useState<SentSummary | null>(null);
  const [reports, setReports] = useState<SentReportRow[]>([]);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [freeWrittenReportsEnabled, setFreeWrittenReportsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const [level, setLevel] = useState<AdminSentReportLevelFilter>("all");
  const [organizationId, setOrganizationId] = useState("");
  const [sentFrom, setSentFrom] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSections, setEditSections] = useState<WrittenReportSections | null>(null);
  const [editLibraryDrillIds, setEditLibraryDrillIds] = useState<string[]>([]);
  const [editFixItSlug, setEditFixItSlug] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (level !== "all") {
      params.set("level", level);
    }
    if (organizationId) {
      params.set("organizationId", organizationId);
    }
    if (sentFrom) {
      params.set("sentFrom", sentFrom);
    }
    if (sentTo) {
      params.set("sentTo", sentTo);
    }
    if (search.trim()) {
      params.set("q", search.trim());
    }
    return params.toString();
  }, [level, organizationId, sentFrom, sentTo, search]);

  const loadSent = useCallback(async () => {
    setLoading(true);
    const url = queryString ? `/api/admin/reports/sent?${queryString}` : "/api/admin/reports/sent";
    const response = await fetch(url);
    setLoading(false);
    if (!response.ok) {
      setReports([]);
      setSummary(null);
      return;
    }
    const data = (await response.json()) as {
      summary: SentSummary;
      reports: SentReportRow[];
      organizations: OrgOption[];
      freeWrittenReportsEnabled: boolean;
    };
    setSummary(data.summary);
    setReports(data.reports);
    setOrganizations(data.organizations);
    setFreeWrittenReportsEnabled(data.freeWrittenReportsEnabled);
  }, [queryString]);

  useEffect(() => {
    void loadSent();
  }, [loadSent]);

  const startEdit = (row: SentReportRow) => {
    setEditingId(row.id);
    setEditSections({ ...row.sections });
    setEditLibraryDrillIds([...row.libraryDrillIds]);
    setEditFixItSlug(row.recommendedFixItSlug ?? "");
    setActionError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSections(null);
    setEditLibraryDrillIds([]);
    setEditFixItSlug("");
    setActionError("");
  };

  const openPdf = async (submissionId: string) => {
    setActionBusy(`pdf-${submissionId}`);
    setActionError("");
    const response = await fetch(
      `/api/player-evaluations/download?submissionId=${encodeURIComponent(submissionId)}`,
    );
    setActionBusy(null);
    const data = (await response.json().catch(() => ({}))) as {
      downloadUrl?: string;
      error?: string;
    };
    if (!response.ok || !data.downloadUrl) {
      setActionError(data.error ?? "Unable to open PDF.");
      return;
    }
    window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
  };

  const resendEmail = async (submissionId: string) => {
    setActionBusy(`resend-${submissionId}`);
    setActionError("");
    const response = await fetch(`/api/admin/reports/${submissionId}/resend`, { method: "POST" });
    setActionBusy(null);
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setActionError(data.error ?? "Unable to resend email.");
      return;
    }
  };

  const regeneratePdf = async (submissionId: string) => {
    if (!editSections) {
      setActionError("Nothing to save.");
      return;
    }
    setActionBusy(`regen-${submissionId}`);
    setActionError("");
    const response = await fetch(`/api/admin/reports/${submissionId}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sections: editSections,
        libraryDrillIds: editLibraryDrillIds,
        recommendedFixItSlug: editFixItSlug || null,
      }),
    });
    setActionBusy(null);
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setActionError(data.error ?? "Unable to regenerate PDF.");
      return;
    }
    cancelEdit();
    await loadSent();
  };

  const avgTurnaroundLabel =
    summary?.averageTurnaroundMsLast30Days != null
      ? formatTurnaroundDuration(summary.averageTurnaroundMsLast30Days)
      : "--";

  return (
    <div className="mt-6 space-y-6">
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Sent this week</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">{summary.sentThisWeek}</p>
          </div>
          <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Sent this month</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">{summary.sentThisMonth}</p>
          </div>
          <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Sent all time</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">{summary.sentAllTime}</p>
          </div>
          <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Avg turnaround (30d)</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">{avgTurnaroundLabel}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-[#2b3650] bg-black/20 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-xs text-zinc-400">
          Level
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as AdminSentReportLevelFilter)}
            className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-2 py-2 text-sm text-zinc-100"
          >
            <option value="all">All</option>
            <option value="core">Core</option>
            <option value="org_trial">Org trial</option>
            {freeWrittenReportsEnabled ? <option value="free">Free</option> : null}
          </select>
        </label>
        <label className="block text-xs text-zinc-400">
          Organization
          <select
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-2 py-2 text-sm text-zinc-100"
          >
            <option value="">All</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-zinc-400">
          Sent from
          <input
            type="date"
            value={sentFrom}
            onChange={(event) => setSentFrom(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-2 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="block text-xs text-zinc-400">
          Sent to
          <input
            type="date"
            value={sentTo}
            onChange={(event) => setSentTo(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-2 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="block text-xs text-zinc-400 sm:col-span-2 lg:col-span-1">
          Player search
          <div className="mt-1 flex gap-2">
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSearch(searchDraft);
                }
              }}
              placeholder="Name"
              className="min-w-0 flex-1 rounded-lg border border-[#2b3650] bg-black/40 px-2 py-2 text-sm text-zinc-100"
            />
            <button
              type="button"
              onClick={() => setSearch(searchDraft)}
              className="rounded-lg border border-[#52B788]/50 px-3 py-2 text-xs font-semibold text-[#52B788]"
            >
              Go
            </button>
          </div>
        </label>
      </div>

      {loading ? <p className="text-sm text-zinc-400">Loading sent reports...</p> : null}
      {!loading && reports.length === 0 ? (
        <p className="text-sm text-zinc-400">No sent reports match these filters.</p>
      ) : null}

      <div className="space-y-4">
        {reports.map((row) => {
          const fixItLabel = fixItSlugToLabel(row.recommendedFixItSlug);
          const orgTeam = [row.organizationName, row.teamName].filter(Boolean).join(" | ");
          const isEditing = editingId === row.id;
          const turnaround =
            row.turnaroundMs != null ? formatTurnaroundDuration(row.turnaroundMs) : "--";

          return (
            <article
              key={row.id}
              className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-zinc-100">{row.playerName}</p>
                  <p className="mt-1 text-sm text-zinc-300">{row.levelLabel}</p>
                  {orgTeam ? <p className="mt-1 text-xs text-zinc-400">{orgTeam}</p> : null}
                </div>
                {row.editCount > 0 ? (
                  <span className="rounded-full border border-[#2b3650] px-2 py-1 text-xs text-zinc-400">
                    Edited {row.editCount}x
                  </span>
                ) : null}
              </div>

              <dl className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Submitted</dt>
                  <dd className="text-zinc-200">{formatDateTime(row.submittedAt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Sent</dt>
                  <dd className="text-zinc-200">{row.sentAt ? formatDateTime(row.sentAt) : "--"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Turnaround</dt>
                  <dd className="text-zinc-200">{turnaround}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Drills attached</dt>
                  <dd className="text-zinc-200">
                    {row.drillCount > 0
                      ? `${row.drillCount}: ${row.drillTitles.join(", ")}`
                      : "None"}
                  </dd>
                </div>
                {fixItLabel ? (
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500">Fix-It recommended</dt>
                    <dd className="text-zinc-200">{fixItLabel}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionBusy === `pdf-${row.id}`}
                  onClick={() => void openPdf(row.id)}
                  className="rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-semibold text-zinc-200 disabled:opacity-60"
                >
                  Open PDF
                </button>
                <Link
                  href={`/profile?type=swing&id=${encodeURIComponent(row.id)}`}
                  className="rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-semibold text-zinc-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Player view
                </Link>
                <button
                  type="button"
                  disabled={actionBusy === `resend-${row.id}`}
                  onClick={() => void resendEmail(row.id)}
                  className="rounded-full border border-[#52B788]/50 px-3 py-1.5 text-xs font-semibold text-[#52B788] disabled:opacity-60"
                >
                  Resend email
                </button>
                <button
                  type="button"
                  onClick={() => (isEditing ? cancelEdit() : startEdit(row))}
                  className="rounded-full border border-amber-500/50 px-3 py-1.5 text-xs font-semibold text-amber-200"
                >
                  {isEditing ? "Cancel edit" : "Edit and regenerate PDF"}
                </button>
              </div>

              {isEditing && editSections ? (
                <div className="mt-4 space-y-4 border-t border-[#2b3650] pt-4">
                  <p className="text-xs text-zinc-400">
                    Original sent date is kept. Each save is logged for audit.
                  </p>
                  <EditableSectionList
                    label="Strengths"
                    lines={editSections.strengths}
                    onChange={(lines) => setEditSections({ ...editSections, strengths: lines })}
                  />
                  <EditableSectionList
                    label="Areas to improve"
                    lines={editSections.areasToImprove}
                    onChange={(lines) => setEditSections({ ...editSections, areasToImprove: lines })}
                  />
                  <EditableSectionList
                    label="Recommended drills"
                    lines={editSections.recommendedDrills}
                    onChange={(lines) =>
                      setEditSections({ ...editSections, recommendedDrills: lines })
                    }
                  />
                  <label className="block text-sm text-zinc-300">
                    Note from Coach Broc
                    <textarea
                      value={editSections.noteFromCoach}
                      onChange={(event) =>
                        setEditSections({ ...editSections, noteFromCoach: event.target.value })
                      }
                      rows={5}
                      className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                  <AdminDrillPicker
                    title="Library drills"
                    description="Up to 2 library drills."
                    maxSelectable={2}
                    selectedIds={editLibraryDrillIds}
                    onChange={setEditLibraryDrillIds}
                  />
                  <label className="block text-sm text-zinc-300">
                    Recommended Fix-It plan
                    <select
                      value={editFixItSlug}
                      onChange={(event) => setEditFixItSlug(event.target.value)}
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
                    disabled={actionBusy === `regen-${row.id}`}
                    onClick={() => void regeneratePdf(row.id)}
                    className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                  >
                    {actionBusy === `regen-${row.id}` ? "Saving..." : "Save and regenerate PDF"}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {actionError ? <p className="text-sm text-red-300">{actionError}</p> : null}
    </div>
  );
}
