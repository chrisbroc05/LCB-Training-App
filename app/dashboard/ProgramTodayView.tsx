"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { escapeHtml } from "@/lib/escape-text";
import { parseReflectionNote, SATURDAY_REFLECTION_FIELDS } from "@/lib/program-content";
import { PROGRAM_PHASE_LABELS } from "@/lib/program-content";
import { formatProgramStartLabel, parseProgramDateKey } from "@/lib/program-schedule";

const CARD =
  "mobile-card rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 shadow-sm";
const BTN_PRIMARY =
  "flex h-12 w-full items-center justify-center rounded-full bg-[#2D6A4F] text-base font-semibold text-white disabled:opacity-50";
const BTN_OUTLINE =
  "inline-flex h-10 items-center justify-center rounded-full border border-[#2b3650] bg-black/40 px-4 text-sm font-semibold text-zinc-200";

type ProgramWeekDayStatus = {
  programDay: number;
  dayOfWeek: number;
  weekdayLabel: string;
  weekdayName: string;
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
  targetDetail?: string;
  focus?: string;
  waysLabel?: string;
  ideas?: string[];
  drills?: Array<{ title: string; href: string }>;
  workout?: { category: string; ageGroup: string; week: number; workoutId: string };
  needsNote: boolean;
  inSeasonNote?: string;
  playbookChapter?: number;
  playbookHref?: string;
  playbookIsRead?: boolean;
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
  viewedWeekdayName: string;
};

type AnswerSheetState = {
  task: ProgramTodayTask;
  question?: string;
  placeholder: string;
  rereadChapter?: number;
} | null;

type TaskCategory = {
  label: string;
  icon: ReactNode;
};

function getTaskCategory(type: string): TaskCategory {
  switch (type) {
    case "hitting":
      return { label: "HITTING", icon: "H" };
    case "fielding":
      return { label: "FIELDING", icon: "F" };
    case "strength":
    case "core":
      return { label: "STRENGTH", icon: "S" };
    case "speed":
    case "sprint":
      return { label: "SPEED", icon: "P" };
    case "mobility":
      return { label: "MOBILITY", icon: "M" };
    case "reflection":
      return { label: "REFLECTION", icon: "R" };
    default:
      return { label: "MINDSET", icon: "I" };
  }
}

function FlameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3c1 3 3 4.5 3 7a3 3 0 1 1-6 0c0-2 1.5-3.5 3-7Z"
        fill="#52B788"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function AnswerBottomSheet({
  sheet,
  programDay,
  canComplete,
  onClose,
  onSaved,
}: {
  sheet: NonNullable<AnswerSheetState>;
  programDay: number;
  canComplete: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { task } = sheet;
  const isReflection = task.type === "reflection";
  const parsedReflection = task.note ? parseReflectionNote(task.note) : null;
  const [note, setNote] = useState(task.note ?? "");
  const [reflection, setReflection] = useState({
    bestRep: parsedReflection?.bestRep ?? "",
    stillHard: parsedReflection?.stillHard ?? "",
    knownForNext: parsedReflection?.knownForNext ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const questionText = sheet.question ?? task.mindsetPrompt ?? task.target ?? task.title;

  const submit = async () => {
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

    onSaved();
    onClose();
  };

  const canSave = isReflection
    ? reflection.bestRep.trim() && reflection.stillHard.trim() && reflection.knownForNext.trim()
    : note.trim().length >= 3;

  if (!canComplete) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#18243a] bg-[#0b1324] p-5 shadow-2xl">
        <p className="text-xl font-semibold leading-snug text-zinc-100">{questionText}</p>
        {sheet.rereadChapter ? (
          <Link
            href={`/playbook?chapter=${sheet.rereadChapter}`}
            className="mt-3 inline-block text-sm font-medium text-[#98b144] hover:text-[#b5d84f]"
          >
            Reread Chapter {sheet.rereadChapter}
          </Link>
        ) : null}
        <div className="mt-4 space-y-3">
          {isReflection ? (
            SATURDAY_REFLECTION_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="text-sm font-medium text-zinc-300">{field.label}</span>
                <textarea
                  value={reflection[field.key as keyof typeof reflection]}
                  onChange={(event) =>
                    setReflection((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-zinc-100"
                />
              </label>
            ))
          ) : (
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={sheet.placeholder}
              rows={4}
              className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-zinc-100"
            />
          )}
        </div>
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => void submit()} disabled={saving || !canSave} className={BTN_PRIMARY}>
            {saving ? "Saving..." : "Save answer"}
          </button>
          <button type="button" onClick={onClose} className={BTN_OUTLINE}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function WeekDayCircle({
  day,
  onSelect,
}: {
  day: ProgramWeekDayStatus;
  onSelect: (programDay: number) => void;
}) {
  const statusClass =
    day.status === "complete"
      ? "border-[#52B788] bg-[#52B788] text-[#0A1628]"
      : day.status === "partial"
        ? "border-[#52B788] bg-transparent text-[#52B788]"
        : day.status === "missed"
          ? "border-[#475569] bg-[#24314a] text-zinc-400"
          : "border-[#2b3650] bg-transparent text-zinc-500";

  const sizeClass = day.isToday ? "h-11 w-11 ring-2 ring-[#52B788]/70" : "h-9 w-9";

  const circle = (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`flex items-center justify-center rounded-full border-2 text-xs font-bold ${statusClass} ${sizeClass}`}
      >
        {day.status === "complete" ? <CheckIcon /> : day.weekdayLabel}
      </span>
      <span className="flex h-3 items-center justify-center">
        {day.status === "complete" ? (
          <span className="text-[10px] text-[#52B788]">
            <CheckIcon />
          </span>
        ) : day.isToday ? (
          <span className="h-1.5 w-1.5 rounded-full bg-[#52B788]" />
        ) : null}
      </span>
    </div>
  );

  if (day.tappable) {
    return (
      <button
        type="button"
        onClick={() => onSelect(day.programDay)}
        className="rounded-full"
        aria-label={`View ${day.weekdayName}`}
      >
        {circle}
      </button>
    );
  }

  return <div aria-label={`${day.weekdayName} upcoming`}>{circle}</div>;
}

function TaskCard({
  task,
  programDay,
  canComplete,
  canAccessPlaybook,
  onUpdate,
  onOpenAnswer,
}: {
  task: ProgramTodayTask;
  programDay: number;
  canComplete: boolean;
  canAccessPlaybook: boolean;
  onUpdate: () => void;
  onOpenAnswer: (sheet: NonNullable<AnswerSheetState>) => void;
}) {
  const isWorkout = task.type === "speed" || task.type === "strength" || task.type === "mobility";
  const category = getTaskCategory(task.type);
  const usesAnswerSheet =
    task.type === "mindset" ||
    task.type === "reflection" ||
    (task.type === "playbook" && !task.playbookIsRead);
  const isPlaybookRead = task.type === "playbook" && task.playbookIsRead;

  const handleUndo = async () => {
    const response = await fetch(
      `/api/program/tasks/complete?programDay=${programDay}&taskKey=${encodeURIComponent(task.key)}`,
      { method: "DELETE" },
    );
    if (response.ok) {
      onUpdate();
    }
  };

  return (
    <article
      className={`${CARD} ${task.completed ? "border-l-4 border-l-[#52B788]" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#52B788]/20 text-xs font-bold text-[#52B788]">
          {category.icon}
        </span>
        <span className="text-xs font-bold tracking-wide text-[#52B788]">{category.label}</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-zinc-100">{task.title}</h3>
      <p className="mt-2 text-[28px] font-bold leading-tight text-zinc-100">{task.target}</p>
      {task.targetDetail ? (
        <p className="mt-1 text-base text-zinc-300">{task.targetDetail}</p>
      ) : null}
      {task.focus ? <p className="mt-2 text-base font-medium text-zinc-200">{task.focus}</p> : null}
      {task.inSeasonNote ? (
        <p className="mt-2 text-sm font-semibold text-[#9df3bd]">{task.inSeasonNote}</p>
      ) : null}
      {task.ideas && task.ideas.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold tracking-wide text-[#52B788]">
            {task.waysLabel ?? "WAYS TO GET THEM"}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {task.ideas.map((idea) => (
              <li key={idea} className="flex gap-2">
                <span className="text-[#52B788]">-</span>
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {task.drills && task.drills.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-bold tracking-wide text-[#52B788]">RECOMMENDED DRILLS</p>
          <p className="mt-1 text-sm text-zinc-300">Tap to watch before you start.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {task.drills.map((drill) => (
              <Link
                key={drill.href}
                href={drill.href}
                className="inline-flex items-center gap-2 rounded-full border border-[#52B788]/50 bg-[#52B788]/10 px-3 py-2 text-sm font-medium text-[#9df3bd]"
              >
                <PlayChipIcon />
                {drill.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {isPlaybookRead && task.playbookHref && canAccessPlaybook ? (
        <Link href={task.playbookHref} className={`${BTN_OUTLINE} mt-4 w-full`}>
          Open Chapter {task.playbookChapter}
        </Link>
      ) : null}

      {isWorkout ? (
        <Link
          href={`/program/workout/${programDay}/${encodeURIComponent(task.key)}`}
          className={`${BTN_PRIMARY} mt-4`}
        >
          Open workout
        </Link>
      ) : null}

      {task.completed ? (
        <div className="mt-4 border-t border-[#18243a] pt-4">
          <div className="flex items-center gap-2 text-[#9df3bd]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#52B788] text-[#0A1628]">
              <CheckIcon />
            </span>
            <p className="text-sm font-semibold">Completed</p>
          </div>
          {task.note ? (
            <div className="mt-3 rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3">
              <p
                className="whitespace-pre-wrap text-sm text-zinc-200"
                dangerouslySetInnerHTML={{ __html: escapeHtml(task.note) }}
              />
            </div>
          ) : null}
          {canComplete ? (
            <button
              type="button"
              onClick={() => void handleUndo()}
              className="mt-3 text-sm font-medium text-zinc-400 underline"
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}

      {!task.completed && canComplete && !isWorkout ? (
        <>
          {usesAnswerSheet ? (
            <button
              type="button"
              onClick={() =>
                onOpenAnswer({
                  task,
                  placeholder:
                    isPlaybookRead
                      ? "One line: what stood out?"
                      : task.type === "mindset" || task.type === "playbook"
                        ? "Your answer"
                        : "What did you do? How did it feel?",
                  rereadChapter:
                    task.type === "playbook" && !task.playbookIsRead
                      ? task.playbookChapter
                      : undefined,
                })
              }
              className={`${BTN_PRIMARY} mt-4`}
            >
              Answer
            </button>
          ) : isPlaybookRead ? (
            <button
              type="button"
              onClick={() =>
                onOpenAnswer({
                  task,
                  question: "One line: what stood out?",
                  placeholder: "One line: what stood out?",
                })
              }
              className={`${BTN_PRIMARY} mt-4`}
            >
              Check off
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onOpenAnswer({
                  task,
                  placeholder: "What did you do? How did it feel?",
                })
              }
              className={`${BTN_PRIMARY} mt-4`}
            >
              Check off
            </button>
          )}
        </>
      ) : null}
    </article>
  );
}

export default function ProgramTodayView() {
  const [payload, setPayload] = useState<ProgramTodayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewedProgramDay, setViewedProgramDay] = useState<number | null>(null);
  const [answerSheet, setAnswerSheet] = useState<AnswerSheetState>(null);

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
      <div className={`${CARD} text-sm text-zinc-400`}>Loading Today...</div>
    );
  }

  if (error || !payload) {
    return (
      <div className={`${CARD} text-sm text-red-300`}>{error || "Unable to load Today."}</div>
    );
  }

  const progressPercent = Math.min(100, Math.round((payload.todayProgramDay / 84) * 100));
  const phaseLabel = PROGRAM_PHASE_LABELS[payload.programDayInfo.phase as keyof typeof PROGRAM_PHASE_LABELS];
  const viewingDifferentDay = payload.viewedProgramDay !== payload.todayProgramDay;

  return (
    <div className="space-y-3">
      <section className={`${CARD} border-[#2b3650]`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-zinc-100">
              Week {payload.programDayInfo.weekNumber || 1} . Day{" "}
              {payload.programDayInfo.dayOfWeek || 1}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-[#52B788] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0A1628]">
              {phaseLabel}
            </span>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#52B788]/40 bg-[#52B788]/10 px-3 py-1.5">
              <FlameIcon />
              <span className="text-sm font-semibold text-zinc-100">
                {payload.streak}-day streak
              </span>
            </div>
            {payload.streak === 0 ? (
              <p className="mt-1 text-xs text-zinc-400">Finish every task today to start one.</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#0A1628]">
          <div
            className="h-full rounded-full bg-[#52B788]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {payload.knownFor ? (
        <section className={`${CARD} border-[#52B788]/40`}>
          <p className="text-xs font-bold uppercase tracking-widest text-[#52B788]">YOUR GOAL</p>
          <p className="mt-2 text-lg font-medium leading-snug text-zinc-100">{payload.knownFor}</p>
        </section>
      ) : null}

      <section className={CARD}>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#52B788]">This week</p>
        <div className="flex items-center justify-between gap-1">
          {payload.weekDays.map((day) => (
            <WeekDayCircle
              key={day.programDay}
              day={day}
              onSelect={(programDay) => void loadToday(programDay)}
            />
          ))}
        </div>
      </section>

      {payload.isComplete ? (
        <section className={`${CARD} text-center`}>
          <h3 className="text-xl font-semibold text-zinc-100">You finished the 12 weeks.</h3>
          <p className="mt-2 text-sm text-zinc-400">Finish screen coming soon.</p>
        </section>
      ) : null}

      {!payload.isComplete && payload.isBeforeStart ? (
        <>
          <section className={CARD}>
            <h3 className="text-xl font-semibold text-zinc-100">
              Your program starts {startLabel}.
            </h3>
            <p className="mt-2 text-sm text-zinc-400">Preview of Day 1 tasks:</p>
          </section>
          <div className="space-y-3 opacity-90">
            {payload.previewTasks.map((task) => (
              <article key={task.key} className={CARD}>
                <h3 className="text-lg font-semibold text-zinc-100">{task.title}</h3>
                <p className="mt-2 text-[28px] font-bold text-zinc-100">{task.target}</p>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {!payload.isComplete && !payload.isBeforeStart && payload.isRestDay ? (
        <section className={`${CARD} text-center`}>
          <h3 className="text-xl font-semibold text-zinc-100">Rest day.</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Recover, hang out, be a kid. Back at it tomorrow.
          </p>
        </section>
      ) : null}

      {!payload.isComplete && !payload.isBeforeStart && !payload.isRestDay ? (
        <>
          {viewingDifferentDay ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#18243a] bg-[#0b1324]/90 px-4 py-3">
              <p className="text-sm font-medium text-zinc-200">
                {payload.isViewingYesterday
                  ? "Viewing yesterday. You can still check these off."
                  : `Viewing ${payload.viewedWeekdayName}. View only.`}
              </p>
              <button type="button" onClick={() => void loadToday()} className={BTN_OUTLINE}>
                Back to today
              </button>
            </div>
          ) : null}

          {payload.allTasksComplete ? (
            <section className="rounded-2xl border border-[#52B788]/40 bg-[#52B788]/10 px-5 py-4 text-center text-sm font-semibold text-[#9df3bd]">
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
                onOpenAnswer={setAnswerSheet}
              />
            ))}
          </div>
        </>
      ) : null}

      {!payload.isBeforeStart && !payload.isRestDay && payload.programDayInfo.dayOfWeek !== 7 ? (
        <section className={CARD}>
          <h3 className="text-lg font-semibold text-zinc-100">This week&apos;s video</h3>
          {payload.weeklyVideoSent ? (
            <p className="mt-2 text-sm font-semibold text-[#9df3bd]">
              Sent. I&apos;ll get back to you this week.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-zinc-400">Not sent yet. Due Sunday night.</p>
              <Link href="/coaching-submissions" className={`${BTN_PRIMARY} mt-4`}>
                Submit your video
              </Link>
            </>
          )}
        </section>
      ) : null}

      {answerSheet ? (
        <AnswerBottomSheet
          sheet={answerSheet}
          programDay={payload.viewedProgramDay}
          canComplete={payload.canCompleteTasks}
          onClose={() => setAnswerSheet(null)}
          onSaved={() => void loadToday(viewedProgramDay ?? undefined)}
        />
      ) : null}
    </div>
  );
}
