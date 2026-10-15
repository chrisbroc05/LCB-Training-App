"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProgramNoteField from "@/app/components/ProgramNoteField";
import { escapeHtml } from "@/lib/escape-text";
import { canSaveProgramNote } from "@/lib/program-note-shared";
import type { ProgramTrackExercise } from "@/lib/program-tracks";

type ProgramTrackChecklistProps = {
  programDay: number;
  taskKey: string;
  title: string;
  safetyNote: string;
  equipmentNote?: string;
  equipmentNoteUrl?: string;
  equipment: string;
  exercises: ProgramTrackExercise[];
  drills?: Array<{ title: string; href: string }>;
  initialNote?: string;
  initialCompleted: boolean;
};

export default function ProgramTrackChecklist({
  programDay,
  taskKey,
  title,
  safetyNote,
  equipmentNote,
  equipmentNoteUrl,
  equipment,
  exercises,
  drills,
  initialNote = "",
  initialCompleted,
}: ProgramTrackChecklistProps) {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allChecked = exercises.every((exercise) => checked[exercise.name]);

  const saveCompletion = async () => {
    setSaving(true);
    setError("");

    const response = await fetch("/api/program/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programDay,
        taskKey,
        note,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to save track completion.");
      return;
    }

    setSavedNote(note);
    setCompleted(true);
    router.push("/dashboard/today");
  };

  const undoCompletion = async () => {
    setSaving(true);
    setError("");

    const response = await fetch(
      `/api/program/tasks/complete?programDay=${programDay}&taskKey=${encodeURIComponent(taskKey)}`,
      { method: "DELETE" },
    );

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to undo completion.");
      return;
    }

    setCompleted(false);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-zinc-100">
      <Link href="/dashboard/today" className="text-sm font-semibold text-[#52B788]">
        Back to today
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">Equipment: {equipment}</p>

      <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <p className="font-semibold text-amber-200">Safety</p>
        <p className="mt-1">{safetyNote}</p>
      </div>

      {equipmentNote ? (
        <div className="mt-3 rounded-xl border border-[#2b3650] bg-[#0b1324] px-4 py-3 text-sm text-zinc-300">
          <p>{equipmentNote}</p>
          {equipmentNoteUrl ? (
            <a
              href={equipmentNoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-semibold text-[#52B788]"
            >
              View J-Bands
            </a>
          ) : null}
        </div>
      ) : null}

      {drills && drills.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-bold tracking-wide text-[#52B788]">RECOMMENDED DRILLS</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {drills.map((drill) => (
              <Link
                key={drill.href}
                href={drill.href}
                className="rounded-full border border-[#52B788]/50 bg-[#52B788]/10 px-3 py-2 text-sm font-medium text-[#9df3bd]"
              >
                {drill.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <ul className="mt-6 space-y-4">
        {exercises.map((exercise) => (
          <li key={exercise.name} className="rounded-xl border border-[#2b3650] bg-[#0b1324] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={Boolean(checked[exercise.name])}
                disabled={completed}
                onChange={(event) =>
                  setChecked((prev) => ({ ...prev, [exercise.name]: event.target.checked }))
                }
                className="mt-1 h-4 w-4 rounded border-[#2b3650]"
              />
              <span>
                <span className="font-semibold text-zinc-100">
                  {exercise.name}
                  {exercise.optional ? " (optional)" : ""}
                </span>
                <span className="mt-1 block text-sm text-[#52B788]">{exercise.prescription}</span>
                <span className="mt-2 block text-sm text-zinc-400">{exercise.formCue}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {!completed ? (
        <div className="mt-6">
          <ProgramNoteField
            value={note}
            onChange={setNote}
            placeholder="What did you get done today?"
          />
          <button
            type="button"
            disabled={saving || !allChecked || !canSaveProgramNote(note)}
            onClick={() => void saveCompletion()}
            className="mt-4 w-full rounded-xl bg-[#52B788] px-4 py-3 text-sm font-bold text-[#0A1628] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Mark complete"}
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3">
          <p className="text-sm font-semibold text-[#9df3bd]">Completed</p>
          {savedNote ? (
            <p
              className="mt-2 whitespace-pre-wrap text-sm text-zinc-200"
              dangerouslySetInnerHTML={{ __html: escapeHtml(savedNote) }}
            />
          ) : null}
          <button
            type="button"
            onClick={() => void undoCompletion()}
            className="mt-3 text-sm font-medium text-zinc-400 underline"
          >
            Undo
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
