"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProgramNoteField from "@/app/components/ProgramNoteField";
import { escapeHtml } from "@/lib/escape-text";
import {
  canSaveProgramNote,
  getWorkoutNotePlaceholder,
} from "@/lib/program-note-shared";
import type { WorkoutWithCues } from "@/lib/workout-program-types";

type ProgramWorkoutChecklistProps = {
  programDay: number;
  taskKey: string;
  workout: WorkoutWithCues;
  inSeasonNote?: string;
  showBodyweightNote: boolean;
  initialNote?: string;
  initialCompleted: boolean;
};

export default function ProgramWorkoutChecklist({
  programDay,
  taskKey,
  workout,
  inSeasonNote,
  showBodyweightNote,
  initialNote = "",
  initialCompleted,
}: ProgramWorkoutChecklistProps) {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      setError(payload.error ?? "Unable to save workout completion.");
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
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/dashboard/today"
        className="text-sm font-medium text-[#98b144] transition hover:text-[#b5d84f]"
      >
        Back to Today
      </Link>

      <header className="mt-4 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h1 className="text-2xl font-semibold text-zinc-100">{workout.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Week {workout.weekNumber} | {workout.ageGroup} | {workout.category.replace("_", " ")}
        </p>
        {inSeasonNote ? (
          <p className="mt-3 rounded-xl border border-[#52B788]/40 bg-[#52B788]/10 px-4 py-3 text-sm text-[#9df3bd]">
            {inSeasonNote}
          </p>
        ) : null}
        {showBodyweightNote ? (
          <p className="mt-3 rounded-xl border border-[#52B788]/40 bg-[#52B788]/10 px-4 py-3 text-sm text-[#9df3bd]">
            No gym today? Do what you can with bodyweight and tell me in your note. Bodyweight versions
            are coming soon.
          </p>
        ) : null}
      </header>

      <div className="mt-6 space-y-5">
        {workout.sections.map((section) => (
          <section
            key={section.name}
            className="mobile-card rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5"
          >
            <h2 className="text-lg font-semibold text-zinc-100">{section.name}</h2>
            {section.rounds ? (
              <p className="mt-1 text-sm text-zinc-400">{section.rounds} rounds</p>
            ) : null}
            <ul className="mt-4 space-y-4">
              {section.exercises.map((exercise) => {
                const key = `${section.name}:${exercise.name}`;
                return (
                  <li key={key} className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(checked[key])}
                        onChange={(event) =>
                          setChecked((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded border-zinc-500"
                      />
                      <span>
                        <span className="block text-base font-semibold text-zinc-100">
                          {exercise.name}
                        </span>
                        <span className="mt-1 block text-sm text-zinc-300">
                          {exercise.sets ? `${exercise.sets} x ` : ""}
                          {exercise.repsOrTime}
                          {exercise.rest && exercise.rest !== "-" ? ` | Rest: ${exercise.rest}` : ""}
                        </span>
                        {exercise.formCue ? (
                          <span className="mt-2 block text-sm text-[#52B788]">{exercise.formCue}</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="mobile-card mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Finish this workout</h2>
        <div className="mt-4">
          <ProgramNoteField
            value={note}
            onChange={setNote}
            placeholder={getWorkoutNotePlaceholder()}
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        {completed ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-[#9df3bd]">Workout logged.</p>
            <p
              className="whitespace-pre-wrap text-sm text-zinc-300"
              dangerouslySetInnerHTML={{ __html: escapeHtml(savedNote) }}
            />
            <button
              type="button"
              onClick={() => void undoCompletion()}
              disabled={saving}
              className="rounded-full border border-[#2b3650] px-5 py-3 text-sm font-semibold text-zinc-300"
            >
              Undo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void saveCompletion()}
            disabled={saving || !canSaveProgramNote(note)}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#2D6A4F] text-base font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Complete workout"}
          </button>
        )}
      </section>
    </div>
  );
}
