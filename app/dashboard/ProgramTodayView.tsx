"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ProgramDayLogSection from "@/app/dashboard/ProgramDayLogSection";
import ProgramPushPrompt from "@/components/ProgramPushPrompt";
import VideosFromCoachLink from "@/components/VideosFromCoachLink";
import ProgramNoteField from "@/app/components/ProgramNoteField";
import { escapeHtml } from "@/lib/escape-text";
import {
  canSaveProgramNote,
  canSaveReflectionFields,
  getTaskNotePlaceholder,
  isLowEffortNote,
  LOW_EFFORT_NOTE_MESSAGE,
  MIN_PROGRAM_NOTE_LENGTH,
  PROGRAM_NOTE_REMINDER,
} from "@/lib/program-note-shared";
import { parseReflectionNote, SATURDAY_REFLECTION_FIELDS } from "@/lib/program-content";
import { PROGRAM_PHASE_LABELS } from "@/lib/program-content";
import { BRAND_SECONDARY_TAGLINE } from "@/lib/brand-copy";
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
  status: "complete" | "partial" | "missed" | "upcoming" | "rest" | "not_started";
  isToday: boolean;
  tappable: boolean;
  editable: boolean;
  completionRatio: number;
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
  isCoachAdded?: boolean;
  completed: boolean;
  note?: string;
  countedFromLog?: "game" | "practice" | null;
};

type DayLogPayload = {
  id: string;
  programDay: number;
  type: "GAME" | "PRACTICE";
  note: string;
  createdAt: string;
  summary: string | null;
  line: string | null;
  gameStats: {
    opponent: string | null;
    atBats: number;
    hits: number;
    doubles: number;
    triples: number;
    homeRuns: number;
    walks: number;
    hitByPitch: number;
    runs: number;
    rbis: number;
    strikeouts: number;
    stolenBases: number;
    errors: number;
  } | null;
};

type SeasonStatsPayload = {
  games: number;
  avg: string;
  obp: string;
  hits: number;
  rbis: number;
  stolenBases: number;
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
  unwatchedCoachVideoCount: number;
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
  headerLabel: string;
  progressWeekNumber: number;
  weekFocusCue?: string | null;
  weekFocusNote?: string | null;
  dayLogs?: DayLogPayload[];
  seasonStats?: SeasonStatsPayload | null;
  canLogDay?: boolean;
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
    case "custom":
      return { label: "COACH", icon: "C" };
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
    ? canSaveReflectionFields(reflection)
    : canSaveProgramNote(note);

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
            SATURDAY_REFLECTION_FIELDS.map((field) => {
              const value = reflection[field.key as keyof typeof reflection];
              const trimmedLength = value.trim().length;
              return (
                <label key={field.key} className="block space-y-2">
                  <span className="text-sm font-medium text-zinc-300">{field.label}</span>
                  <p className="text-xs text-zinc-500">{PROGRAM_NOTE_REMINDER}</p>
                  <textarea
                    value={value}
                    onChange={(event) =>
                      setReflection((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    rows={2}
                    maxLength={400}
                    className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-zinc-100"
                  />
                  <div className="flex items-start justify-between gap-3">
                    {isLowEffortNote(value) ? (
                      <p className="text-xs text-red-300">{LOW_EFFORT_NOTE_MESSAGE}</p>
                    ) : (
                      <span className="text-xs text-transparent">.</span>
                    )}
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        trimmedLength >= MIN_PROGRAM_NOTE_LENGTH
                          ? "text-[#9df3bd]"
                          : "text-zinc-500"
                      }`}
                    >
                      {trimmedLength}/{MIN_PROGRAM_NOTE_LENGTH}
                    </span>
                  </div>
                </label>
              );
            })
          ) : (
            <ProgramNoteField
              value={note}
              onChange={setNote}
              placeholder={sheet.placeholder}
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

function RestIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3c-1.5 2.4-4 4.2-4 7.5a4 4 0 1 0 8 0c0-3.3-2.5-5.1-4-7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 21h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WeekDayCircle({
  day,
  onSelect,
}: {
  day: ProgramWeekDayStatus;
  onSelect: (programDay: number, isToday: boolean) => void;
}) {
  const size = day.isToday ? 44 : 36;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, day.completionRatio));
  const dashOffset = circumference * (1 - progress);
  const isDimmed = day.status === "not_started" || day.status === "upcoming";

  const labelClass = isDimmed ? "text-zinc-600" : "text-zinc-300";

  const inner = (
    <div className="flex min-w-[42px] flex-col items-center gap-1">
      <div
        className={`relative flex items-center justify-center ${day.isToday ? "rounded-full ring-2 ring-[#52B788]" : ""}`}
        style={{ width: size, height: size }}
      >
        {day.status === "rest" ? (
          <span className="flex h-9 w-9 items-center justify-center text-zinc-500">
            <RestIcon />
          </span>
        ) : day.status === "not_started" ? (
          <span className={`text-xs font-bold ${labelClass}`}>{day.weekdayLabel}</span>
        ) : (
          <>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="absolute inset-0 -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#2b3650"
                strokeWidth="3"
              />
              {day.status === "complete" ? (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#52B788"
                  strokeWidth="3"
                />
              ) : day.status === "partial" ? (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#52B788"
                  strokeWidth="3"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${dashOffset}`}
                  strokeLinecap="round"
                />
              ) : day.status === "missed" ? (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="2"
                />
              ) : null}
            </svg>
            <span className={`relative text-xs font-bold ${labelClass}`}>
              {day.status === "complete" ? <CheckIcon /> : day.weekdayLabel}
            </span>
          </>
        )}
      </div>
      <span className="min-h-[14px] text-[10px] font-semibold text-[#52B788]">
        {day.isToday ? "Today" : day.status === "complete" && day.dayOfWeek !== 7 ? "" : ""}
      </span>
    </div>
  );

  if (day.tappable) {
    return (
      <button
        type="button"
        onClick={() => onSelect(day.programDay, day.isToday)}
        className="rounded-full"
        aria-label={`View ${day.weekdayName}`}
      >
        {inner}
      </button>
    );
  }

  return <div aria-label={`${day.weekdayName} ${day.status}`}>{inner}</div>;
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
        {task.isCoachAdded ? (
          <span className="rounded-full bg-[#52B788]/15 px-2 py-0.5 text-[10px] font-semibold text-[#52B788]">
            FROM COACH BROC
          </span>
        ) : null}
        {task.countedFromLog === "game" ? (
          <span className="rounded-full bg-[#52B788]/10 px-2 py-0.5 text-[10px] font-semibold text-[#9df3bd]">
            COUNTED FROM GAME
          </span>
        ) : null}
        {task.countedFromLog === "practice" ? (
          <span className="rounded-full bg-[#52B788]/10 px-2 py-0.5 text-[10px] font-semibold text-[#9df3bd]">
            COUNTED FROM PRACTICE
          </span>
        ) : null}
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
                  placeholder: getTaskNotePlaceholder(task),
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
                  question: "What stood out to you, and why?",
                  placeholder: getTaskNotePlaceholder(task),
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
                  placeholder: getTaskNotePlaceholder(task),
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

type ProgramEmailPromptState = {
  parentEmail: string | null;
  parentPromptDismissedAt: string | null;
};

export default function ProgramTodayView() {
  const [payload, setPayload] = useState<ProgramTodayPayload | null>(null);
  const [emailPrompt, setEmailPrompt] = useState<ProgramEmailPromptState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewedProgramDay, setViewedProgramDay] = useState<number | null>(null);
  const [answerSheet, setAnswerSheet] = useState<AnswerSheetState>(null);
  const todayTasksRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/program/email-settings");
      if (!response.ok) {
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        enrollment?: ProgramEmailPromptState;
      };

      if (data.enrollment) {
        setEmailPrompt(data.enrollment);
      }
    })();
  }, []);

  const dismissParentPrompt = async () => {
    await fetch("/api/program/email-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissParentPrompt: true }),
    });
    setEmailPrompt((current) =>
      current
        ? {
            ...current,
            parentPromptDismissedAt: new Date().toISOString(),
          }
        : current,
    );
  };

  const showParentPrompt =
    emailPrompt &&
    !emailPrompt.parentEmail &&
    !emailPrompt.parentPromptDismissedAt;

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

  const progressPercent = Math.min(
    100,
    Math.round((payload.progressWeekNumber / 12) * 100),
  );
  const phaseLabel = PROGRAM_PHASE_LABELS[payload.programDayInfo.phase as keyof typeof PROGRAM_PHASE_LABELS];
  const viewingDifferentDay = payload.viewedProgramDay !== payload.todayProgramDay;

  const handleWeekDaySelect = (programDay: number, isToday: boolean) => {
    if (isToday) {
      todayTasksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    void loadToday(programDay);
  };

  return (
    <div className="space-y-3">
      <section className={`${CARD} border-[#2b3650]`}>
        <div>
          <p className="text-xl font-bold text-zinc-100">{payload.headerLabel}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#52B788] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0A1628]">
              {phaseLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#52B788]/40 bg-[#52B788]/10 px-3 py-1 text-xs font-semibold text-zinc-100">
              <FlameIcon />
              {payload.streak}-day streak
            </span>
          </div>
          {payload.streak === 0 ? (
            <p className="mt-1 text-xs text-zinc-400">Finish every task today to start one.</p>
          ) : null}
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#0A1628]">
          <div
            className="h-full rounded-full bg-[#52B788]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <ProgramPushPrompt />

      <section className={CARD}>
        <VideosFromCoachLink
          layout="today"
          unwatchedCount={payload.unwatchedCoachVideoCount}
          className="w-full justify-center"
        />
      </section>

      {showParentPrompt ? (
        <section className={`${CARD} border-[#52B788]/40`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Add a second email</p>
              <p className="mt-1 text-sm text-zinc-400">
                Optional. A parent or another email gets weekly recaps and a heads up if things slip.
              </p>
              <Link href="/program/parent" className="mt-3 inline-flex text-sm font-semibold text-[#52B788]">
                Set up second email
              </Link>
            </div>
            <button
              type="button"
              onClick={() => void dismissParentPrompt()}
              className="rounded-full border border-[#2b3650] px-3 py-1 text-xs font-semibold text-zinc-400"
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      {!payload.isBeforeStart && !payload.isComplete ? (
        <ProgramDayLogSection
          programDay={payload.viewedProgramDay}
          canLogDay={Boolean(payload.canLogDay)}
          dayLogs={payload.dayLogs ?? []}
          onSaved={() => void loadToday(viewedProgramDay ?? undefined)}
        />
      ) : null}

      {payload.knownFor ? (
        <section className={`${CARD} border-[#52B788]/40`}>
          <p className="text-xs font-bold tracking-wide text-[#52B788]">{BRAND_SECONDARY_TAGLINE}</p>
          <p className="mt-2 text-lg font-medium leading-snug text-zinc-100">{payload.knownFor}</p>
        </section>
      ) : null}

      <section className={CARD}>
        <div className="flex items-center justify-between gap-2">
          {payload.weekDays.map((day) => (
            <WeekDayCircle
              key={day.programDay}
              day={day}
              onSelect={handleWeekDaySelect}
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
            <p className="mt-2 text-sm text-zinc-400">Preview of your first day:</p>
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

          {payload.weekFocusNote ? (
            <section className={`${CARD} border-[#52B788]/40`}>
              <p className="text-xs font-bold tracking-wide text-[#52B788]">
                THIS WEEK FROM COACH BROC
              </p>
              {payload.weekFocusCue ? (
                <p className="mt-2 text-lg font-bold text-zinc-100">{payload.weekFocusCue}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{payload.weekFocusNote}</p>
            </section>
          ) : null}

          <div ref={todayTasksRef} id="today-tasks" className="space-y-3">
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

      {payload.seasonStats ? (
        <Link href="/program/stats" className={`${CARD} block`}>
          <p className="text-xs font-bold tracking-wide text-[#52B788]">MY STATS</p>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              ["Games", payload.seasonStats.games],
              ["AVG", payload.seasonStats.avg],
              ["OBP", payload.seasonStats.obp],
              ["H", payload.seasonStats.hits],
              ["RBI", payload.seasonStats.rbis],
              ["SB", payload.seasonStats.stolenBases],
            ].map(([label, value]) => (
              <div key={label} className="text-center">
                <p className="text-xs font-bold text-zinc-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        </Link>
      ) : null}

      {!payload.isBeforeStart && !payload.isComplete ? (
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
