"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminOrganizationTeamRecord } from "@/lib/admin-organizations-shared";
import { formatWeekStartLabel } from "@/lib/org-weekly-focus-shared";

type DrillOption = { id: string; title: string; categoryLabel: string };

type FocusRecord = {
  id: string;
  weekStartDate: string;
  weekStartLabel: string;
  orgTeamId: string | null;
  scopeLabel: string;
  title: string;
  notes: string | null;
  drillIds: string[];
};

type TeamPreviewRow = {
  teamId: string;
  teamName: string;
  focusTitle: string | null;
  source: "team" | "club" | "none";
};

type OrgWeeklyFocusAdminPanelProps = {
  organizationId: string;
  teams: AdminOrganizationTeamRecord[];
};

const emptyForm = {
  weekStartDate: "",
  scope: "club" as "club" | string,
  title: "",
  notes: "",
  drillIds: [] as string[],
  focusId: null as string | null,
};

export default function OrgWeeklyFocusAdminPanel({
  organizationId,
  teams,
}: OrgWeeklyFocusAdminPanelProps) {
  const [form, setForm] = useState(emptyForm);
  const [focuses, setFocuses] = useState<FocusRecord[]>([]);
  const [teamPreview, setTeamPreview] = useState<TeamPreviewRow[]>([]);
  const [drillOptions, setDrillOptions] = useState<DrillOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeTeams = useMemo(() => teams.filter((team) => team.active), [teams]);

  const loadFocuses = useCallback(
    async (week?: string) => {
      const query = week ? `?week=${encodeURIComponent(week)}` : "";
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/weekly-focus${query}`,
      );
      const data = (await response.json()) as {
        focuses?: FocusRecord[];
        teamPreview?: TeamPreviewRow[];
        defaultWeekStart?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load weekly focus.");
      }
      setFocuses(data.focuses ?? []);
      setTeamPreview(data.teamPreview ?? []);
      if (data.defaultWeekStart && !week) {
        setForm((current) => ({
          ...current,
          weekStartDate: current.weekStartDate || data.defaultWeekStart || "",
        }));
      }
      return data;
    },
    [organizationId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const drillResponse = await fetch("/api/admin/drill-library");
        const drillData = (await drillResponse.json()) as {
          videos?: Array<{ id: string; title: string; categoryLabel: string }>;
        };
        if (!cancelled && drillResponse.ok) {
          setDrillOptions(
            (drillData.videos ?? []).map((video) => ({
              id: video.id,
              title: video.title,
              categoryLabel: video.categoryLabel,
            })),
          );
        }
        await loadFocuses();
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load weekly focus.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFocuses]);

  useEffect(() => {
    if (!form.weekStartDate) {
      return;
    }
    void loadFocuses(form.weekStartDate).catch(() => {
      /* preview refresh is best-effort */
    });
  }, [form.weekStartDate, loadFocuses]);

  function resetForm(weekStartDate: string) {
    setForm({
      ...emptyForm,
      weekStartDate,
    });
    setStatus(null);
    setError(null);
  }

  function startEdit(record: FocusRecord) {
    setForm({
      weekStartDate: record.weekStartDate,
      scope: record.orgTeamId ?? "club",
      title: record.title,
      notes: record.notes ?? "",
      drillIds: record.drillIds.slice(0, 3),
      focusId: record.id,
    });
    setStatus(null);
    setError(null);
  }

  async function saveFocus() {
    setStatus("Saving...");
    setError(null);
    const title = form.title.trim();
    if (!title) {
      setStatus(null);
      setError("Title is required.");
      return;
    }
    if (!form.weekStartDate.trim()) {
      setStatus(null);
      setError("Choose a week (Monday, Chicago time).");
      return;
    }

    const response = await fetch(`/api/admin/organizations/${organizationId}/weekly-focus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        focusId: form.focusId,
        weekStartDate: form.weekStartDate,
        orgTeamId: form.scope === "club" ? null : form.scope,
        title,
        notes: form.notes.trim() || null,
        drillIds: form.drillIds,
      }),
    });
    const data = (await response.json()) as {
      error?: string;
      focuses?: FocusRecord[];
      teamPreview?: TeamPreviewRow[];
      defaultWeekStart?: string;
    };

    if (!response.ok) {
      setStatus(null);
      setError(data.error ?? "Could not save weekly focus.");
      return;
    }

    setFocuses(data.focuses ?? []);
    setTeamPreview(data.teamPreview ?? []);
    setStatus("Saved");
    resetForm(form.weekStartDate);
  }

  async function deleteFocus(focusId: string) {
    if (!window.confirm("Delete this weekly focus?")) {
      return;
    }
    setError(null);
    const response = await fetch(
      `/api/admin/organizations/${organizationId}/weekly-focus/${focusId}`,
      { method: "DELETE" },
    );
    const data = (await response.json()) as {
      error?: string;
      focuses?: FocusRecord[];
      teamPreview?: TeamPreviewRow[];
    };
    if (!response.ok) {
      setError(data.error ?? "Could not delete weekly focus.");
      return;
    }
    setFocuses(data.focuses ?? []);
    setTeamPreview(data.teamPreview ?? []);
    setStatus("Deleted");
  }

  function toggleDrill(drillId: string) {
    setForm((current) => {
      if (current.drillIds.includes(drillId)) {
        return { ...current, drillIds: current.drillIds.filter((id) => id !== drillId) };
      }
      if (current.drillIds.length >= 3) {
        setError("Choose up to 3 drills.");
        return current;
      }
      setError(null);
      return { ...current, drillIds: [...current.drillIds, drillId] };
    });
  }

  if (loading) {
    return <p className="mt-5 text-sm text-zinc-500">Loading weekly focus...</p>;
  }

  return (
    <div className="mt-5 border-t border-[#2b3650] pt-4">
      <p className="text-sm font-semibold text-zinc-200">Weekly org focus</p>
      <p className="mt-1 text-xs text-zinc-500">
        Weeks start on Monday (America/Chicago). Team focus overrides whole-club focus for that team.
      </p>

      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      {status ? (
        <p className={`mt-2 text-sm ${status === "Saved" || status === "Deleted" ? "text-[#9df3bd]" : "text-zinc-400"}`}>
          {status}
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-400">
          Week (Monday)
          <input
            type="date"
            value={form.weekStartDate}
            onChange={(event) => setForm((current) => ({ ...current, weekStartDate: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="text-xs text-zinc-400">
          Applies to
          <select
            value={form.scope}
            onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
          >
            <option value="club">Whole club</option>
            {activeTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <input
        type="text"
        value={form.title}
        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        placeholder="Focus title"
        className="mt-3 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
      />
      <textarea
        rows={2}
        value={form.notes}
        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
        placeholder="Notes for players (optional)"
        className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
      />

      <div className="mt-3">
        <p className="text-xs text-zinc-400">Featured drills (up to 3)</p>
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#2b3650] p-2">
          {drillOptions.length === 0 ? (
            <p className="text-xs text-zinc-500">No drills loaded.</p>
          ) : (
            drillOptions.map((drill) => (
              <label key={drill.id} className="flex cursor-pointer items-start gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.drillIds.includes(drill.id)}
                  onChange={() => toggleDrill(drill.id)}
                  className="mt-0.5"
                />
                <span>
                  {drill.title}
                  <span className="text-zinc-500"> ({drill.categoryLabel})</span>
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void saveFocus()}
          className="rounded-full bg-[#22c55e] px-4 py-2 text-xs font-semibold text-black"
        >
          {form.focusId ? "Update weekly focus" : "Save weekly focus"}
        </button>
        {form.focusId ? (
          <button
            type="button"
            onClick={() => resetForm(form.weekStartDate)}
            className="rounded-full border border-[#2b3650] px-4 py-2 text-xs font-semibold text-zinc-200"
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      {teamPreview.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            This week by team ({formatWeekStartLabel(form.weekStartDate || new Date())})
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {teamPreview.map((row) => (
              <li key={row.teamId}>
                <span className="font-medium text-zinc-200">{row.teamName}:</span>{" "}
                {row.focusTitle ?? "(none)"}
                {row.source === "team" ? (
                  <span className="text-xs text-[#9df3bd]"> (team)</span>
                ) : row.source === "club" ? (
                  <span className="text-xs text-zinc-500"> (whole club)</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {focuses.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Saved focuses</p>
          <ul className="mt-2 divide-y divide-[#2b3650] rounded-lg border border-[#2b3650]">
            {focuses.map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm text-zinc-300"
              >
                <span>
                  <span className="text-zinc-500">{record.weekStartLabel}</span>
                  {" | "}
                  <span className="text-zinc-400">{record.scopeLabel}</span>
                  {" | "}
                  {record.title}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(record)}
                    className="text-xs font-semibold text-[#52B788]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteFocus(record.id)}
                    className="text-xs font-semibold text-red-300"
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-xs text-zinc-500">No weekly focuses saved yet.</p>
      )}
    </div>
  );
}
