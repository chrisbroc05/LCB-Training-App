"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { escapeHtml } from "@/lib/escape-text";
import { parseReflectionNote, SATURDAY_REFLECTION_FIELDS } from "@/lib/program-content";
import { PROGRAM_PHASE_LABELS } from "@/lib/program-content";
import { formatProgramStartLabel, parseProgramDateKey } from "@/lib/program-schedule";

type ProgramWeekDayStatus = {
  programDay: number;
  dayOfWeek: number;
  status: "complete" | "partial" | "missed" | "today" | "upcoming" | "rest";
  editable: boolean;
};

type ProgramTodayTask = {
  key: string;
  type: string;
  title: string;
  target: string;
  focus?: string;
  ideas?: string[];
  drills?: Array<{ title: string; href: string }>;
  workout?: { category: string; ageGroup: string; week: number; workoutId: string };
  needsNote: boolean;
  inSeasonNote?: string;
  playbookChapter?: number;
  playbookHref?: string;
  mindsetPrompt?: string;
  reflectionFields?: Array<{ key: string; label: string }>;
  completed: boolean;
  note?: string;
};

type ProgramTodayPayload = {
  todayProgramDay: number;
  viewedProgramDay: number;
  programDayInfo: {
    programDay: number;
    weekNumber: number;
    dayOfWeek: number;
    phase: string;
    isBeforeStart: boolean;
    isComplete: boolean;
  };
  tasks: ProgramTodayTask[];
  previewTasks: ProgramTodayTask[];
  streak: number;
  weekDays: ProgramWeekDayStatus[];
  allTasksComplete: boolean;
  weeklyVideoSent: boolean;
  knownFor: string | null;
  startDate: string | null;
  isBeforeStart: boolean;
  isComplete: boolean;
  isRestDay: boolean;
  canAccessPlaybook: boolean;
};

function TaskNoteForm({
  task,
  programDay,
  onSaved,
  onUndo,
}: {
  task: ProgramTodayTask;
  programDay: number;
  onSaved: () => void;
  onUndo: () => void;
}) {
  const isReflection = task.type === "reflection";
  const parsedReflection = task.note ? parseReflectionNote(task.note) : null;
  const [note, setNote] = useState(task.note ?? "");
  const [reflection, setReflection] = useState({
    bestRep: parsedReflection?.bestRep ?? "",
    stillHard: parsedReflection?.stillHard ?? "",
    knownForNext: parsedReflection?.knownForNext ?? "",
  });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submitNote = async () => {
    setSaving(true);
    setError("");

    const payloadNote = isReflection
      ? `Best rep: ${reflection.bestRep.trim()} | Still hard: ${reflection.stillHard.trim()} | Known for: ${reflection.knownForNext.trim()}`
      : note;

    const response = await fetch("/api/program/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programDay,
        taskKey: task.key,
        note: payloadNote,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to save.");
      return;
    }

    setOpen(false);
    onSaved();
  };

  const handleUndo = async () => {
    setSaving(true);
    setError("");
    const response = await fetch(
      `/api/program/tasks/complete?programDay=${programDay}&taskKey=${encodeURIComponent(task.key)}`,
      { method: "DELETE" },
    );
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "Unable to undo.");
      return;
    }
    onUndo();
  };

  if (task.completed) {
    return (
      <div className="mt-4 border-t border-[#E5E7EB] pt-4">
        <p className="text-sm font-semibold text-[#2D6A4F]">Completed</p>
        <p
          className="mt-2 whitespace-pre-wrap text-sm text-[#6B7280]"
          dangerouslySetInnerHTML={{ __html: escapeHtml(task.note ?? "") }}
        />
        <button
          type="button"
          onClick={() => void handleUndo()}
          disabled={saving}
          className="mt-3 text-sm font-medium text-[#6B7280] underline"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-full bg-[#2D6A4F] px-5 py-4 text-base font-semibold text-white"
        >
          Check off
        </button>
      ) : (
        <div className="space-y-3">
          {isReflection ? (
            SATURDAY_REFLECTION_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="text-sm font-medium text-[#6B7280]">{field.label}</span>
                <textarea
                  value={reflection[field.key as keyof typeof reflection]}
                  onChange={(event) =>
                    setReflection((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-[#0A1628]"
                  required
                />
              </label>
            ))
          ) : (
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                task.type === "mindset" || task.type === "playbook"
                  ? "Your answer"
                  : "What did you do? How did it feel?"
              }
              rows={4}
              className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-[#0A1628]"
            />
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void submitNote()}
              disabled={
                saving ||
                (isReflection
                  ? !reflection.bestRep.trim() ||
                    !reflection.stillHard.trim() ||
                    !reflection.knownForNext.trim()
                  : note.trim().length < 3)
              }
              className="flex-1 rounded-full bg-[#2D6A4F] px-5 py-4 text-base font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-[#6B7280] px-5 py-4 text-sm font-semibold text-[#6B7280]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  programDay,
  canAccessPlaybook,
  onUpdate,
}: {
  task: ProgramTodayTask;
  programDay: number;
  canAccessPlaybook: boolean;
  onUpdate: () => void;
}) {
  const isWorkout = task.type === "speed" || task.type === "strength" || task.type === "mobility";

  return (
    <article className="rounded-2xl border border-[#D1D5DB] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#0A1628]">{task.title}</h3>
      <p className="mt-2 text-2xl font-bold text-[#2D6A4F]">{task.target}</p>
      {task.focus ? <p className="mt-2 text-sm text-[#6B7280]">{task.focus}</p> : null}
      {task.inSeasonNote ? (
        <p className="mt-2 text-sm font-medium text-[#2D6A4F]">{task.inSeasonNote}</p>
      ) : null}
      {task.ideas && task.ideas.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#6B7280]">
          {task.ideas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      ) : null}
      {task.drills && task.drills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {task.drills.map((drill) => (
            <Link
              key={drill.href}
              href={drill.href}
              className="rounded-full border border-[#52B788] px-3 py-2 text-sm font-medium text-[#2D6A4F]"
            >
              {drill.title}
            </Link>
          ))}
        </div>
      ) : null}
      {task.type === "playbook" && task.playbookHref && canAccessPlaybook ? (
        <Link
          href={task.playbookHref}
          className="mt-4 inline-flex rounded-full border border-[#2D6A4F] px-5 py-3 text-sm font-semibold text-[#2D6A4F]"
        >
          Open playbook
        </Link>
      ) : null}
      {isWorkout ? (
        <Link
          href={`/program/workout/${programDay}/${encodeURIComponent(task.key)}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0A1628] px-5 py-4 text-base font-semibold text-white"
        >
          Open workout
        </Link>
      ) : null}
      {!isWorkout ? (
        <TaskNoteForm task={task} programDay={programDay} onSaved={onUpdate} onUndo={onUpdate} />
      ) : null}
    </article>
  );
}

export default function ProgramTodayView() {
  const [payload, setPayload] = useState<ProgramTodayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewedProgramDay, setViewedProgramDay] = useState<number | null>(null);

  const loadToday = useCallback(async (programDay?: number) => {
    setLoading(true);
    setError("");

    const query = programDay ? `?programDay=${programDay}` : "";
    const response = await fetch(`/api/program/today${query}`);
    const data = (await response.json().catch(() => ({}))) as ProgramTodayPayload & {
      error?: string;
    };

    if (!response.ok) {
      setError(data.error ?? "Unable to load Today.");
      setLoading(false);
      return;
    }

    setPayload(data);
    setViewedProgramDay(data.viewedProgramDay);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  const startLabel = useMemo(() => {
    if (!payload?.startDate) {
      return "soon";
    }

    return formatProgramStartLabel(parseProgramDateKey(payload.startDate));
  }, [payload?.startDate]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#D1D5DB] bg-white p-6 text-sm text-[#6B7280]">
        Loading Today...
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="rounded-2xl border border-red-300 bg-white p-6 text-sm text-red-600">
        {error || "Unable to load Today."}
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((payload.todayProgramDay / 84) * 100));
  const phaseLabel = PROGRAM_PHASE_LABELS[payload.programDayInfo.phase as keyof typeof PROGRAM_PHASE_LABELS];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#D1D5DB] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
              Week {payload.programDayInfo.weekNumber || 1} of 12
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#0A1628]">{phaseLabel}</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#6B7280]">
              {payload.streak > 0 ? `${payload.streak}-day streak` : "Start your streak today."}
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-[#52B788]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">Day {payload.todayProgramDay} of 84</p>
      </section>

      {payload.knownFor ? (
        <section className="rounded-2xl border border-[#2D6A4F]/30 bg-[#2D6A4F]/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2D6A4F]">Your goal</p>
          <p className="mt-2 text-base font-medium text-[#0A1628]">{payload.knownFor}</p>
        </section>
      ) : null}

      {payload.viewedProgramDay !== payload.todayProgramDay ? (
        <button
          type="button"
          onClick={() => void loadToday()}
          className="rounded-full border border-[#2D6A4F] px-5 py-3 text-sm font-semibold text-[#2D6A4F]"
        >
          Back to today
        </button>
      ) : null}

      <section className="rounded-2xl border border-[#D1D5DB] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          {payload.weekDays.map((day) => {
            const circleClass =
              day.status === "complete"
                ? "bg-[#52B788] border-[#52B788] text-white"
                : day.status === "partial"
                  ? "border-[#52B788] text-[#2D6A4F]"
                  : day.status === "today"
                    ? "border-[#0A1628] bg-[#0A1628] text-white"
                    : day.status === "rest"
                      ? "border-[#D1D5DB] text-[#6B7280]"
                      : "border-[#D1D5DB] text-[#6B7280]";

            const content = (
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${circleClass}`}
              >
                {day.dayOfWeek}
              </span>
            );

            if (day.editable) {
              return (
                <button
                  key={day.programDay}
                  type="button"
                  onClick={() => void loadToday(day.programDay)}
                  className="rounded-full"
                  aria-label={`Open day ${day.dayOfWeek}`}
                >
                  {content}
                </button>
              );
            }

            return (
              <div key={day.programDay} aria-label={`Day ${day.dayOfWeek} ${day.status}`}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {payload.isComplete ? (
        <section className="rounded-2xl border border-[#52B788] bg-[#52B788]/10 p-6 text-center">
          <h3 className="text-xl font-semibold text-[#0A1628]">You finished the 12 weeks.</h3>
          <p className="mt-2 text-sm text-[#6B7280]">Finish screen coming soon.</p>
        </section>
      ) : null}

      {!payload.isComplete && payload.isBeforeStart ? (
        <>
          <section className="rounded-2xl border border-[#D1D5DB] bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-[#0A1628]">
              Your program starts {startLabel}.
            </h3>
            <p className="mt-2 text-sm text-[#6B7280]">Preview of Day 1 tasks:</p>
          </section>
          <div className="space-y-4 opacity-80">
            {payload.previewTasks.map((task) => (
              <article
                key={task.key}
                className="rounded-2xl border border-[#D1D5DB] bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[#0A1628]">{task.title}</h3>
                <p className="mt-2 text-xl font-bold text-[#2D6A4F]">{task.target}</p>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {!payload.isComplete && !payload.isBeforeStart && payload.isRestDay ? (
        <section className="rounded-2xl border border-[#D1D5DB] bg-white p-6 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-[#0A1628]">Rest day.</h3>
          <p className="mt-2 text-sm text-[#6B7280]">
            Recover, hang out, be a kid. Back at it tomorrow.
          </p>
        </section>
      ) : null}

      {!payload.isComplete && !payload.isBeforeStart && !payload.isRestDay ? (
        <>
          {payload.allTasksComplete ? (
            <section className="rounded-2xl border border-[#52B788] bg-[#52B788]/15 px-5 py-4 text-center text-sm font-semibold text-[#0A1628]">
              Day done. Work Hard. Be Memorable.
            </section>
          ) : null}
          <div className="space-y-4">
            {payload.tasks.map((task) => (
              <TaskCard
                key={task.key}
                task={task}
                programDay={payload.viewedProgramDay}
                canAccessPlaybook={payload.canAccessPlaybook}
                onUpdate={() => void loadToday(viewedProgramDay ?? undefined)}
              />
            ))}
          </div>
        </>
      ) : null}

      {!payload.isBeforeStart && !payload.isRestDay && payload.programDayInfo.dayOfWeek !== 7 ? (
        <section className="rounded-2xl border border-[#D1D5DB] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0A1628]">This week&apos;s video</h3>
          {payload.weeklyVideoSent ? (
            <p className="mt-2 text-sm font-semibold text-[#2D6A4F]">
              Sent. I&apos;ll get back to you this week.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#6B7280]">Not sent yet. Due Sunday night.</p>
              <Link
                href="/coaching-submissions"
                className="mt-4 inline-flex rounded-full bg-[#2D6A4F] px-5 py-3 text-sm font-semibold text-white"
              >
                Submit your video
              </Link>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
