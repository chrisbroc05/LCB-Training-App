"use client";

import { useMemo, useState } from "react";
import ProgramNoteField, { MAX_DAY_LOG_NOTE_LENGTH } from "@/app/components/ProgramNoteField";
import {
  canSaveProgramNote,
  GAME_PRACTICE_DIRECTION,
  getGameNotePlaceholder,
  getPracticeNotePlaceholder,
} from "@/lib/program-note-shared";
import {
  EMPTY_GAME_STATS,
  formatGameLine,
  type GameStatInput,
} from "@/lib/program-stats";

const CARD =
  "mobile-card rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-sm";
const BTN_PRIMARY =
  "flex h-12 w-full items-center justify-center rounded-full bg-[#2D6A4F] text-base font-semibold text-white disabled:opacity-50";
const BTN_OUTLINE_GREEN =
  "inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#52B788] bg-transparent px-4 text-sm font-semibold text-[#52B788] disabled:opacity-50";

type DayLogRecord = {
  id: string;
  programDay: number;
  type: "GAME" | "PRACTICE";
  note: string;
  createdAt: string;
  summary: string | null;
  line: string | null;
  gameStats: GameStatInput & { opponent: string | null } | null;
};

type SheetMode =
  | { kind: "practice"; editingId?: string }
  | { kind: "game"; editingId?: string }
  | null;

function StatStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#2b3650] bg-black/30 px-3 py-2">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#52B788]/50 text-xl font-bold text-[#52B788]"
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span className="w-8 text-center text-lg font-bold text-zinc-100">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#52B788]/50 text-xl font-bold text-[#52B788]"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function DayLogSheet({
  mode,
  programDay,
  initialNote,
  initialOpponent,
  initialStats,
  onClose,
  onSaved,
}: {
  mode: NonNullable<SheetMode>;
  programDay: number;
  initialNote?: string;
  initialOpponent?: string;
  initialStats?: GameStatInput;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(initialNote ?? "");
  const [opponent, setOpponent] = useState(initialOpponent ?? "");
  const [stats, setStats] = useState<GameStatInput>(initialStats ?? { ...EMPTY_GAME_STATS });
  const [extraBaseOpen, setExtraBaseOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const liveLine = mode.kind === "game" ? formatGameLine(stats) : "";

  const save = async () => {
    setSaving(true);
    setError("");

    const isEdit = Boolean(mode.editingId);
    const response = isEdit
      ? await fetch(`/api/program/day-logs/${mode.editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note,
            opponent: mode.kind === "game" ? opponent : undefined,
            stats: mode.kind === "game" ? stats : undefined,
          }),
        })
      : await fetch("/api/program/day-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programDay,
            type: mode.kind === "game" ? "GAME" : "PRACTICE",
            note,
            opponent: mode.kind === "game" ? opponent : undefined,
            stats: mode.kind === "game" ? stats : undefined,
          }),
        });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to save.");
      return;
    }

    onSaved();
    onClose();
  };

  const canSave = canSaveProgramNote(note, MAX_DAY_LOG_NOTE_LENGTH);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#18243a] bg-[#0b1324] p-5 shadow-2xl">
        <h2 className="text-xl font-semibold text-zinc-100">
          {mode.kind === "game" ? "Game day" : "Practice day"}
        </h2>

        {mode.kind === "game" ? (
          <>
            <label className="mt-4 block text-sm font-medium text-zinc-300">
              Opponent (optional)
            </label>
            <input
              value={opponent}
              onChange={(event) => setOpponent(event.target.value)}
              placeholder="Team name"
              maxLength={60}
              className="mt-2 w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-zinc-100"
            />
          </>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-zinc-300">
          {mode.kind === "game" ? "How did it go?" : "How did practice go?"}
        </label>
        <div className="mt-2">
          <ProgramNoteField
            value={note}
            onChange={setNote}
            placeholder={
              mode.kind === "game"
                ? getGameNotePlaceholder()
                : getPracticeNotePlaceholder()
            }
            maxLength={MAX_DAY_LOG_NOTE_LENGTH}
          />
        </div>

        {mode.kind === "game" ? (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-bold tracking-wide text-[#52B788]">STATS</p>
            <StatStepper
              label="At-bats"
              value={stats.atBats}
              onChange={(value) => setStats((current) => ({ ...current, atBats: value }))}
            />
            <StatStepper
              label="Hits"
              value={stats.hits}
              onChange={(value) => setStats((current) => ({ ...current, hits: value }))}
            />
            <StatStepper
              label="Walks"
              value={stats.walks}
              onChange={(value) => setStats((current) => ({ ...current, walks: value }))}
            />
            <StatStepper
              label="Hit by pitch"
              value={stats.hitByPitch}
              onChange={(value) => setStats((current) => ({ ...current, hitByPitch: value }))}
            />
            <StatStepper
              label="Runs"
              value={stats.runs}
              onChange={(value) => setStats((current) => ({ ...current, runs: value }))}
            />
            <StatStepper
              label="RBIs"
              value={stats.rbis}
              onChange={(value) => setStats((current) => ({ ...current, rbis: value }))}
            />
            <StatStepper
              label="Strikeouts"
              value={stats.strikeouts}
              onChange={(value) => setStats((current) => ({ ...current, strikeouts: value }))}
            />
            <StatStepper
              label="Stolen bases"
              value={stats.stolenBases}
              onChange={(value) => setStats((current) => ({ ...current, stolenBases: value }))}
            />
            <StatStepper
              label="Errors"
              value={stats.errors}
              onChange={(value) => setStats((current) => ({ ...current, errors: value }))}
            />
            <button
              type="button"
              onClick={() => setExtraBaseOpen((open) => !open)}
              className="w-full rounded-xl border border-[#2b3650] px-4 py-3 text-left text-sm font-semibold text-zinc-300"
            >
              Extra-base hits {extraBaseOpen ? "-" : "+"}
            </button>
            {extraBaseOpen ? (
              <div className="space-y-3">
                <StatStepper
                  label="Doubles"
                  value={stats.doubles}
                  onChange={(value) => setStats((current) => ({ ...current, doubles: value }))}
                />
                <StatStepper
                  label="Triples"
                  value={stats.triples}
                  onChange={(value) => setStats((current) => ({ ...current, triples: value }))}
                />
                <StatStepper
                  label="Home runs"
                  value={stats.homeRuns}
                  onChange={(value) => setStats((current) => ({ ...current, homeRuns: value }))}
                />
              </div>
            ) : null}
            <p className="rounded-xl border border-[#52B788]/30 bg-[#52B788]/10 px-4 py-3 text-sm font-semibold text-[#9df3bd]">
              {liveLine}
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => void save()} disabled={saving || !canSave} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#2b3650] px-5 text-sm font-semibold text-zinc-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProgramDayLogSection({
  programDay,
  canLogDay,
  dayLogs,
  onSaved,
}: {
  programDay: number;
  canLogDay: boolean;
  dayLogs: DayLogRecord[];
  onSaved: () => void;
}) {
  const [sheet, setSheet] = useState<SheetMode>(null);

  const hasPracticeLog = useMemo(
    () => dayLogs.some((log) => log.type === "PRACTICE"),
    [dayLogs],
  );

  const openEdit = (log: DayLogRecord) => {
    if (log.type === "PRACTICE") {
      setSheet({ kind: "practice", editingId: log.id });
      return;
    }
    setSheet({
      kind: "game",
      editingId: log.id,
    });
  };

  const deleteLog = async (logId: string) => {
    const response = await fetch(`/api/program/day-logs/${logId}`, { method: "DELETE" });
    if (response.ok) {
      onSaved();
    }
  };

  const editingLog = sheet?.editingId
    ? dayLogs.find((log) => log.id === sheet.editingId)
    : null;

  if (!canLogDay && dayLogs.length === 0) {
    return null;
  }

  return (
    <>
      {canLogDay ? (
        <section className={`${CARD} space-y-3`}>
          <p className="text-sm text-zinc-400">{GAME_PRACTICE_DIRECTION}</p>
          <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSheet({ kind: "game" })}
            className={BTN_OUTLINE_GREEN}
          >
            Game day
          </button>
          <button
            type="button"
            onClick={() => setSheet({ kind: "practice" })}
            disabled={hasPracticeLog}
            className={BTN_OUTLINE_GREEN}
          >
            Practice day
          </button>
          </div>
        </section>
      ) : null}

      {dayLogs.length > 0 ? (
        <div className="space-y-3">
          {dayLogs.map((log) => (
            <article key={log.id} className={CARD}>
              {log.type === "GAME" ? (
                <>
                  <p className="text-sm font-semibold text-zinc-100">
                    {log.summary ?? `Game: ${log.line ?? ""}`}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">{log.note}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-zinc-100">Practice day</p>
                  <p className="mt-2 text-sm text-zinc-400">{log.note}</p>
                </>
              )}
              {canLogDay ? (
                <div className="mt-3 flex gap-4">
                  <button
                    type="button"
                    onClick={() => openEdit(log)}
                    className="text-sm font-semibold text-[#52B788]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteLog(log.id)}
                    className="text-sm font-semibold text-red-300"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {sheet ? (
        <DayLogSheet
          mode={sheet}
          programDay={programDay}
          initialNote={editingLog?.note}
          initialOpponent={editingLog?.gameStats?.opponent ?? ""}
          initialStats={editingLog?.gameStats ?? undefined}
          onClose={() => setSheet(null)}
          onSaved={onSaved}
        />
      ) : null}
    </>
  );
}
