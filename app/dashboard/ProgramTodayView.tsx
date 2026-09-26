"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { escapeHtml } from "@/lib/escape-text";
import { parseReflectionNote, SATURDAY_REFLECTION_FIELDS } from "@/lib/program-content";
import { PROGRAM_PHASE_LABELS } from "@/lib/program-content";
import { formatProgramStartLabel, parseProgramDateKey } from "@/lib/program-schedule";

type ProgramWeekDayStatus = {
  programDay: number;
  dayOfWeek: number;
  weekdayLabel: string;
  status: "complete" | "partial" | "missed" | "upcoming" | "rest";
  isToday: boolean;
  tappable: boolean;
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
  canCompleteTasks: boolean;
  isViewingYesterday: boolean;
  isViewingPastDay: boolean;
};

type TaskCategory = {
  label: string;
  icon: ReactNode;
};

function getTaskCategory(type: string): TaskCategory {
  switch (type) {
    case "hitting":
      return {
        label: "HITTING",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 20 20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 4h12v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      };
    case "fielding":
      return {
        label: "FIELDING",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12c0-4 3.5-7 7-7s7 3 7 7-3.5 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M8 15l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      };
    case "strength":
    case "core":
      return {
        label: "STRENGTH",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 10h4v4H4zM16 10h4v4h-4zM8 12h8" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
      };
    case "speed":
    case "sprint":
      return {
        label: "SPEED",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19 19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M13 5h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      };
    case "mobility":
      return {
        label: "MOBILITY",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v6M9 20l3-7 3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      };
    case "reflection":
      return {
        label: "REFLECTION",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 4h12v14H9l-3 3V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        ),
      };
    default:
      return {
        label: "MINDSET",
        icon: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3a5 5 0 0 1 5 5c0 2-1 3.5-2.5 4.5V14H9.5v-1.5C8 11.5 7 10 7 8a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="2" />
            <path d="M10 18h4v3h-4z" stroke="currentColor" strokeWidth="2" />
          </svg>
        ),
      };
  }
}

function FlameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3c1 3 3 4.5 3 7a3 3 0 1 1-6 0c0-2 1.5-3.5 3-7Z"
        fill="#52B788"
        stroke="#52B788"
        strokeWidth="1.5"
      />
      <path
        d="M12 22c3 0 5-2 5-5 0-2.5-2-4-3-5.5-1 1.5-2 3-2 4.5 0 1.5-1 2.5-2 2.5s-2-1-2-2.5c0-1.5-1-3-2-4.5-1 1.5-3 3-3 5.5 0 3 2 5 5 5Z"
        fill="#52B788"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function PlayChipIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" />
    </svg>
  );
}

function TaskNoteForm({
  task,
  programDay,
  canComplete,
  onSaved,
  onUndo,
}: {
  task: ProgramTodayTask;
  programDay: number;
  canComplete: boolean;
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
        <div className="flex items-center gap-2 text-[#2D6A4F]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#52B788] text-white">
            <CheckIcon />
          </span>
          <p className="text-sm font-semibold">Completed</p>
        </div>
        {task.note ? (
          <div className="mt-3 rounded-xl bg-[#F4F6F8] px-4 py-3">
            <p
              className="whitespace-pre-wrap text-sm text-[#0A1628]"
              dangerouslySetInnerHTML={{ __html: escapeHtml(task.note) }}
            />
          </div>
        ) : null}
        {canComplete ? (
          <button
            type="button"
            onClick={() => void handleUndo()}
            disabled={saving}
            className="mt-3 text-sm font-medium text-[#0A1628] underline"
          >
            Undo
          </button>
        ) : null}
      </div>
    );
  }

  if (!canComplete) {
    return null;
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2D6A4F] text-base font-semibold text-white"
        >
          Check off
        </button>
      ) : (
        <div className="space-y-3">
          {isReflection ? (
            SATURDAY_REFLECTION_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="text-sm font-medium text-[#0A1628]">{field.label}</span>
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
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#2D6A4F] text-base font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center justify-center rounded-xl border border-[#0A1628] px-5 text-sm font-semibold text-[#0A1628]"
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
  canComplete,
  canAccessPlaybook,
  onUpdate,
}: {
  task: ProgramTodayTask;
  programDay: number;
  canComplete: boolean;
  canAccessPlaybook: boolean;
  onUpdate: () => void;
}) {
  const isWorkout = task.type === "speed" || task.type === "strength" || task.type === "mobility";
  const category = getTaskCategory(task.type);

  return (
    <article
      className={`rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(10,22,40,0.08)] ${
        task.completed ? "border-l-4 border-l-[#52B788]" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-[#2D6A4F]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#52B788]/15">
          {category.icon}
        </span>
        <span className="text-xs font-bold tracking-wide">{category.label}</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-[#0A1628]">{task.title}</h3>
      <p className="mt-2 text-[28px] font-bold leading-tight text-[#0A1628]">{task.target}</p>
      {task.focus ? <p className="mt-2 text-base font-medium text-[#0A1628]">{task.focus}</p> : null}
      {task.inSeasonNote ? (
        <p className="mt-2 text-sm font-semibold text-[#2D6A4F]">{task.inSeasonNote}</p>
      ) : null}
      {task.ideas && task.ideas.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-[#0A1628]">
          {task.ideas.map((idea) => (
            <li key={idea} className="flex gap-2">
              <span className="text-[#2D6A4F]">-</span>
              <span>{idea}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {task.drills && task.drills.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-bold tracking-wide text-[#2D6A4F]">RECOMMENDED DRILLS</p>
          <p className="mt-1 text-sm text-[#0A1628]">Tap to watch before you start.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {task.drills.map((drill) => (
              <Link
                key={drill.href}
                href={drill.href}
                className="inline-flex items-center gap-2 rounded-full border border-[#52B788] bg-[#52B788]/10 px-3 py-2 text-sm font-medium text-[#2D6A4F]"
              >
                <PlayChipIcon />
                {drill.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {task.type === "playbook" && task.playbookHref && canAccessPlaybook ? (
        <Link
          href={task.playbookHref}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-[#2D6A4F] text-sm font-semibold text-[#2D6A4F]"
        >
          Open playbook
        </Link>
      ) : null}
      {isWorkout ? (
        <Link
          href={`/program/workout/${programDay}/${encodeURIComponent(task.key)}`}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#2D6A4F] text-base font-semibold text-white"
        >
          Open workout
        </Link>
      ) : null}
      {!isWorkout ? (
        <TaskNoteForm
          task={task}
          programDay={programDay}
          canComplete={canComplete}
          onSaved={onUpdate}
          onUndo={onUpdate}
        />
      ) : null}
    </article>
  );
}

function WeekDayCircle({
  day,
  selected,
  onSelect,
}: {
  day: ProgramWeekDayStatus;
  selected: boolean;
  onSelect: (programDay: number) => void;
}) {
  const statusClass =
    day.status === "complete"
      ? "border-[#52B788] bg-[#52B788] text-white"
      : day.status === "partial"
        ? "border-[#52B788] bg-white text-[#2D6A4F]"
        : day.status === "missed"
          ? "border-[#9CA3AF] bg-[#E5E7EB] text-[#0A1628]"
          : day.status === "rest"
            ? "border-[#D1D5DB] bg-white text-[#0A1628]"
            : "border-[#D1D5DB] bg-white text-[#0A1628]";

  const circle = (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${statusClass} ${
          selected ? "ring-2 ring-[#0A1628] ring-offset-2" : ""
        }`}
      >
        {day.status === "complete" ? <CheckIcon /> : null}
      </span>
      <span className="text-xs font-semibold text-[#0A1628]">{day.weekdayLabel}</span>
      {day.isToday ? (
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#2D6A4F]">Today</span>
      ) : (
        <span className="h-[14px]" aria-hidden="true" />
      )}
    </div>
  );

  if (day.tappable) {
    return (
      <button
        type="button"
        onClick={() => onSelect(day.programDay)}
        className="rounded-full"
        aria-label={`View day ${day.dayOfWeek}`}
        aria-current={selected ? "true" : undefined}
      >
        {circle}
      </button>
    );
  }

  return <div aria-label={`Day ${day.dayOfWeek} upcoming`}>{circle}</div>;
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
      <div className="rounded-2xl bg-white p-6 text-sm text-[#0A1628] shadow-sm">
        Loading Today...
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="rounded-2xl border border-red-300 bg-white p-6 text-sm text-red-700">
        {error || "Unable to load Today."}
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((payload.todayProgramDay / 84) * 100));
  const phaseLabel = PROGRAM_PHASE_LABELS[payload.programDayInfo.phase as keyof typeof PROGRAM_PHASE_LABELS];
  const viewingDifferentDay = payload.viewedProgramDay !== payload.todayProgramDay;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[#0A1628] p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold">
              Week {payload.programDayInfo.weekNumber || 1} . Day {payload.programDayInfo.dayOfWeek || 1}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-[#52B788] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0A1628]">
              {phaseLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FlameIcon />
            {payload.streak > 0 ? `${payload.streak}-day streak` : "Start your streak today"}
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#1B2A44]">
          <div
            className="h-full rounded-full bg-[#52B788]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {payload.knownFor ? (
        <section className="rounded-2xl bg-[#0A1628] p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#52B788]">YOUR GOAL</p>
          <p className="mt-2 text-lg font-medium leading-snug text-white">{payload.knownFor}</p>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(10,22,40,0.08)]">
        <div className="flex items-center justify-between gap-2">
          {payload.weekDays.map((day) => (
            <WeekDayCircle
              key={day.programDay}
              day={day}
              selected={day.programDay === payload.viewedProgramDay}
              onSelect={(programDay) => void loadToday(programDay)}
            />
          ))}
        </div>
      </section>

      {payload.isComplete ? (
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-[#0A1628]">You finished the 12 weeks.</h3>
          <p className="mt-2 text-sm text-[#0A1628]">Finish screen coming soon.</p>
        </section>
      ) : null}

      {!payload.isComplete && payload.isBeforeStart ? (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-[#0A1628]">
              Your program starts {startLabel}.
            </h3>
            <p className="mt-2 text-sm text-[#0A1628]">Preview of Day 1 tasks:</p>
          </section>
          <div className="space-y-3 opacity-90">
            {payload.previewTasks.map((task) => (
              <article
                key={task.key}
                className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(10,22,40,0.08)]"
              >
                <h3 className="text-lg font-semibold text-[#0A1628]">{task.title}</h3>
                <p className="mt-2 text-[28px] font-bold text-[#0A1628]">{task.target}</p>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {!payload.isComplete && !payload.isBeforeStart && payload.isRestDay ? (
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-[#0A1628]">Rest day.</h3>
          <p className="mt-2 text-sm text-[#0A1628]">
            Recover, hang out, be a kid. Back at it tomorrow.
          </p>
        </section>
      ) : null}

      {!payload.isComplete && !payload.isBeforeStart && !payload.isRestDay ? (
        <>
          {viewingDifferentDay ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0A1628] px-4 py-3 text-white">
              <p className="text-sm font-medium">
                {payload.isViewingYesterday
                  ? "Viewing yesterday. You can still check these off."
                  : `Viewing Day ${payload.programDayInfo.dayOfWeek}. View only.`}
              </p>
              <button
                type="button"
                onClick={() => void loadToday()}
                className="rounded-xl border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788]"
              >
                Back to today
              </button>
            </div>
          ) : null}

          {payload.allTasksComplete ? (
            <section className="rounded-2xl bg-[#52B788]/20 px-5 py-4 text-center text-sm font-semibold text-[#0A1628]">
              Day done. Work Hard. Be Memorable.
            </section>
          ) : null}

          <div className="space-y-3">
            {payload.tasks.map((task) => (
              <TaskCard
                key={task.key}
                task={task}
                programDay={payload.viewedProgramDay}
                canComplete={payload.canCompleteTasks}
                canAccessPlaybook={payload.canAccessPlaybook}
                onUpdate={() => void loadToday(viewedProgramDay ?? undefined)}
              />
            ))}
          </div>
        </>
      ) : null}

      {!payload.isBeforeStart && !payload.isRestDay && payload.programDayInfo.dayOfWeek !== 7 ? (
        <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(10,22,40,0.08)]">
          <h3 className="text-lg font-semibold text-[#0A1628]">This week&apos;s video</h3>
          {payload.weeklyVideoSent ? (
            <p className="mt-2 text-sm font-semibold text-[#2D6A4F]">
              Sent. I&apos;ll get back to you this week.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#0A1628]">Not sent yet. Due Sunday night.</p>
              <Link
                href="/coaching-submissions"
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#2D6A4F] text-sm font-semibold text-white"
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
