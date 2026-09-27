"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RecommendDrillsPicker from "@/app/admin/RecommendDrillsPicker";

type CoachCueRecord = {
  id: string;
  label: string;
  drillIds: string[];
  isDefault: boolean;
  defaultWeek: number | null;
  archived: boolean;
};

function CueCard({
  cue,
  onArchiveToggle,
}: {
  cue: CoachCueRecord;
  onArchiveToggle: (id: string, archived: boolean) => void;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        cue.archived
          ? "border-[#2b3650] bg-black/20 opacity-70"
          : "border-[#18243a] bg-[#0b1324]/80"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">
            {cue.isDefault && cue.defaultWeek
              ? `Week ${cue.defaultWeek}: ${cue.label}`
              : cue.label}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {cue.drillIds.length} drill{cue.drillIds.length === 1 ? "" : "s"}
            {cue.archived ? " . Archived" : ""}
          </p>
        </div>
        {!cue.isDefault ? (
          <button
            type="button"
            onClick={() => onArchiveToggle(cue.id, !cue.archived)}
            className="rounded-full border border-[#2b3650] px-3 py-1.5 text-xs font-semibold text-zinc-300"
          >
            {cue.archived ? "Unarchive" : "Archive"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function AdminProgramCuesPanel() {
  const [cues, setCues] = useState<CoachCueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("");
  const [drillIds, setDrillIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadCues = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/program/cues");
      const data = (await response.json().catch(() => ({}))) as {
        cues?: CoachCueRecord[];
        error?: string;
      };
      if (!response.ok || !data.cues) {
        throw new Error(data.error ?? "Unable to load hitting focuses.");
      }
      setCues(data.cues);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load hitting focuses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCues();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/program/cues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, drillIds }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create focus.");
      }
      setLabel("");
      setDrillIds([]);
      await loadCues();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create focus.");
    } finally {
      setSaving(false);
    }
  };

  const updateCue = async (id: string, patch: Partial<CoachCueRecord>) => {
    setError("");
    const response = await fetch(`/api/admin/program/cues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Unable to update focus.");
      return;
    }
    await loadCues();
  };

  const programDefaults = cues.filter((cue) => cue.isDefault);
  const myFocuses = cues.filter((cue) => !cue.isDefault);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">My Hitting Focuses</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
              These are the hitting focuses you can give a player for a week. Each one has drills
              attached, and those drills show under the player&apos;s hitting task that week. The 12
              defaults follow the normal program. Add your own for anything specific you see.
            </p>
          </div>
          <Link
            href="/admin/program"
            className="inline-flex rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Back to overview
          </Link>
        </div>
      </section>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="text-sm text-zinc-400">Loading hitting focuses...</p> : null}

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Add focus</h2>
        <form onSubmit={(event) => void handleCreate(event)} className="mt-4 space-y-4">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Focus label"
            className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-100"
          />
          <RecommendDrillsPicker selectedIds={drillIds} onChange={setDrillIds} />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-[#0A1628] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add focus"}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">Program defaults</h2>
        {programDefaults.map((cue) => (
          <CueCard key={cue.id} cue={cue} onArchiveToggle={(id, archived) => void updateCue(id, { archived })} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">My focuses</h2>
        {myFocuses.length === 0 ? (
          <p className="text-sm text-zinc-400">No custom focuses yet.</p>
        ) : (
          myFocuses.map((cue) => (
            <CueCard key={cue.id} cue={cue} onArchiveToggle={(id, archived) => void updateCue(id, { archived })} />
          ))
        )}
      </section>
    </div>
  );
}
