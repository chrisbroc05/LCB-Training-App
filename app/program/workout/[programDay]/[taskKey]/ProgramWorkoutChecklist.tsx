"use client";

import Link from "next/link";
import { useState } from "react";
import { escapeHtml } from "@/lib/escape-text";
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
      <Link href="/dashboard" className="text-sm font-medium text-[#2D6A4F] hover:text-[#52B788]">
        Back to Today
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold text-[#0A1628]">{workout.title}</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Week {workout.weekNumber} | {workout.ageGroup} | {workout.category.replace("_", " ")}
        </p>
        {inSeasonNote ? (
          <p className="mt-3 rounded-xl border border-[#2D6A4F]/30 bg-[#2D6A4F]/10 px-4 py-3 text-sm text-[#0A1628]">
            {inSeasonNote}
          </p>
        ) : null}
        {showBodyweightNote ? (
          <p className="mt-3 rounded-xl border border-[#2D6A4F]/30 bg-[#2D6A4F]/10 px-4 py-3 text-sm text-[#0A1628]">
            No gym today? Do what you can with bodyweight and tell me in your note. Bodyweight versions
            are coming soon.
          </p>
        ) : null}
      </header>

      <div className="mt-6 space-y-5">
        {workout.sections.map((section) => (
          <section
            key={section.name}
            className="rounded-2xl border border-[#D1D5DB] bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-[#0A1628]">{section.name}</h2>
            {section.rounds ? (
              <p className="mt-1 text-sm text-[#6B7280]">{section.rounds} rounds</p>
            ) : null}
            <ul className="mt-4 space-y-4">
              {section.exercises.map((exercise) => {
                const key = `${section.name}:${exercise.name}`;
                return (
                  <li key={key} className="rounded-xl border border-[#E5E7EB] p-4">
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
                        className="mt-1 h-5 w-5 rounded border-[#6B7280]"
                      />
                      <span>
                        <span className="block text-base font-semibold text-[#0A1628]">
                          {exercise.name}
                        </span>
                        <span className="mt-1 block text-sm text-[#6B7280]">
                          {exercise.sets ? `${exercise.sets} x ` : ""}
                          {exercise.repsOrTime}
                          {exercise.rest && exercise.rest !== "-" ? ` | Rest: ${exercise.rest}` : ""}
                        </span>
                        {exercise.formCue ? (
                          <span className="mt-2 block text-sm text-[#2D6A4F]">{exercise.formCue}</span>
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

      <section className="mt-8 rounded-2xl border border-[#D1D5DB] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0A1628]">Finish this workout</h2>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-[#6B7280]">What did you do? How did it feel?</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What did you do? How did it feel?"
            rows={4}
            className="mt-2 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-[#0A1628]"
          />
        </label>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {completed ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-[#2D6A4F]">Workout logged.</p>
            <p
              className="whitespace-pre-wrap text-sm text-[#6B7280]"
              dangerouslySetInnerHTML={{ __html: escapeHtml(savedNote) }}
            />
            <button
              type="button"
              onClick={() => void undoCompletion()}
              disabled={saving}
              className="rounded-full border border-[#6B7280] px-5 py-3 text-sm font-semibold text-[#6B7280]"
            >
              Undo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void saveCompletion()}
            disabled={saving || note.trim().length < 3}
            className="mt-4 w-full rounded-full bg-[#2D6A4F] px-5 py-4 text-base font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save workout note"}
          </button>
        )}
      </section>
    </div>
  );
}
