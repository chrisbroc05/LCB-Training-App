"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format-date";
import { useCallback, useEffect, useState } from "react";
import RecommendDrillsPicker from "@/app/admin/RecommendDrillsPicker";
import {
  PROGRAM_AGE_GROUP_LABELS,
  PROGRAM_EQUIPMENT_OPTIONS,
  PROGRAM_EQUIPMENT_LABELS,
  PROGRAM_FOCUS_AREAS,
  PROGRAM_FOCUS_AREA_LABELS,
  type ProgramAgeGroup,
  type ProgramEquipmentOption,
  type ProgramFocusArea,
} from "@/lib/program-enrollment-shared";
import {
  STRENGTH_VARIANT_LABELS,
  STRENGTH_VARIANTS,
  type StrengthVariant,
} from "@/lib/strength-variant-shared";
import type { InPersonTrainingInfo } from "@/lib/in-person-training-shared";
import type { AdminCoachVideoSummary } from "@/lib/coach-video-shared";
import SendCoachVideoPanel from "@/app/admin/SendCoachVideoPanel";

type WeekTask = {
  key: string;
  type: string;
  title: string;
  target: string;
  targetDetail?: string;
  focus?: string;
  completed: boolean;
  note?: string | null;
  completedAt?: string | null;
  isCoachAdded?: boolean;
  drills?: Array<{ title: string; href: string }>;
};

type WeekDay = {
  programDay: number;
  dayOfWeek: number;
  isRestDay: boolean;
  tasks: WeekTask[];
};

type PlayerDetail = {
  coachVideosSent: AdminCoachVideoSummary[];
  enrollment: {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    accountRoleLabel: string | null;
    accountHolderName: string | null;
    signedUpBy: string | null;
    refundLabel: string | null;
    startDate: string | null;
    ageGroup: ProgramAgeGroup | null;
    position: string | null;
    focusAreas: string[];
    equipment: string[];
    seasonMode: "IN_SEASON" | "OFF_SEASON" | null;
    knownFor: string | null;
    ageGroupLabel: string | null;
    focusAreaLabels: string[];
    equipmentLabels: string[];
    strengthVariant: string;
    strengthVariantLabel: string;
    seasonModeLabel: string | null;
    parentName: string | null;
    parentEmail: string | null;
    parentEmailsEnabled: boolean;
    dailyRoutineEmailsEnabled: boolean;
    legalAcceptance: {
      termsVersion: string | null;
      termsAcceptedAtLabel: string;
      acceptedByName: string | null;
      agreementRoleLabel: string;
      mediaConsentLabel: string;
      parentConsentStatus: string | null;
    };
    inPersonTraining: InPersonTrainingInfo;
  };
  schedule: {
    weekNumber: number;
    programDay: number;
    dayOfWeek: number;
    phase: string;
  };
  streak: number;
  focus: {
    weekNumber: number;
    defaultCueLabel: string;
    override: {
      id: string;
      cueId: string;
      cueLabel: string;
      note: string;
    } | null;
    nextWeekOverride: {
      weekNumber: number;
      id: string;
      cueId: string;
      cueLabel: string;
      note: string;
    } | null;
  };
  weekSubmissions: Array<{ type: string; id: number; href: string; createdAt: string }>;
  selectedWeek: number;
  weekDays: WeekDay[];
  cues: Array<{ id: string; displayLabel: string }>;
  customTasks: Array<{
    id: string;
    programDay: number;
    title: string;
    target: string;
    details: string | null;
    drillIds: string[];
    replacesTaskKey: string | null;
  }>;
  dayLogs?: Array<{
    id: string;
    programDay: number;
    type: "GAME" | "PRACTICE";
    note: string;
    createdAt: string;
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
  }>;
  stats?: {
    totals: {
      games: number;
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
      avg: string;
      obp: string;
      slg: string;
    };
    gameLogs: Array<{
      id: string;
      programDay: number;
      note: string;
      opponent: string | null;
      line: string;
      summary: string;
      weekdayLabel: string;
    }>;
  };
};

type TaskFormState = {
  programDay: number;
  title: string;
  target: string;
  details: string;
  drillIds: string[];
  replacesTaskKey: string | null;
  editingTaskId: string | null;
};

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function firstNoteLine(note: string) {
  const line = note.split("\n")[0]?.trim();
  return line || note.trim();
}

const emptyTaskForm = (programDay: number): TaskFormState => ({
  programDay,
  title: "",
  target: "",
  details: "",
  drillIds: [],
  replacesTaskKey: null,
  editingTaskId: null,
});

function CustomTaskForm({
  taskForm,
  setTaskForm,
  onSave,
  onCancel,
}: {
  taskForm: TaskFormState;
  setTaskForm: (form: TaskFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-[#52B788]/40 bg-black/30 p-4">
      <h4 className="text-sm font-semibold text-zinc-100">
        {taskForm.editingTaskId ? "Edit custom task" : "Add custom task"}
      </h4>
      <p className="text-xs leading-relaxed text-zinc-400">
        Shows on this player&apos;s Today screen for that day, labeled From Coach Broc. They check
        it off with a note like any other task.
      </p>
      <input
        value={taskForm.title}
        onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
        placeholder="Title"
        className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-100"
      />
      <input
        value={taskForm.target}
        onChange={(event) => setTaskForm({ ...taskForm, target: event.target.value })}
        placeholder="Target"
        className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-100"
      />
      <textarea
        value={taskForm.details}
        onChange={(event) => setTaskForm({ ...taskForm, details: event.target.value })}
        placeholder="Optional details"
        className="min-h-20 w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-100"
      />
      <RecommendDrillsPicker
        selectedIds={taskForm.drillIds}
        onChange={(ids) => setTaskForm({ ...taskForm, drillIds: ids })}
      />
      {taskForm.replacesTaskKey ? (
        <p className="text-xs text-zinc-500">Replacing: {taskForm.replacesTaskKey}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSave()}
          className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0A1628]"
        >
          Save task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminProgramPlayerPanel({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [openingMessage, setOpeningMessage] = useState(false);
  const [showSendVideo, setShowSendVideo] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [focusCueId, setFocusCueId] = useState("");
  const [focusNote, setFocusNote] = useState("");
  const [focusTarget, setFocusTarget] = useState<"this_week" | "next_week">("this_week");
  const [focusSuccess, setFocusSuccess] = useState("");
  const [taskForm, setTaskForm] = useState<TaskFormState | null>(null);

  const loadDetail = useCallback(async (week?: number) => {
    setError("");
    try {
      const weekQuery = week != null && week >= 1 && week <= 12 ? `?week=${week}` : "";
      const response = await fetch(
        `/api/admin/program/enrollments/${enrollmentId}${weekQuery}`,
      );
      const data = (await response.json().catch(() => ({}))) as PlayerDetail & { error?: string };
      if (!response.ok || !data.enrollment) {
        throw new Error(data.error ?? "Unable to load player.");
      }
      setDetail(data);
      setSelectedWeek(data.selectedWeek);
      setFocusCueId(data.focus.override?.cueId ?? "");
      setFocusNote(data.focus.override?.note ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load player.");
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    setLoading(true);
    void loadDetail();
  }, [loadDetail]);

  const patchEnrollment = async (patch: Record<string, unknown>) => {
    const response = await fetch(`/api/admin/program/enrollments/${enrollmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Unable to update enrollment.");
      return;
    }
    await loadDetail(selectedWeek);
  };

  const saveFocusOverride = async () => {
    if (!detail) {
      return;
    }

    const currentFocusLabel =
      detail.focus.override?.cueLabel ?? detail.focus.defaultCueLabel;
    const savingForNextWeek = focusTarget === "next_week";

    const response = await fetch(
      `/api/admin/program/enrollments/${enrollmentId}/focus-override`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cueId: focusCueId,
          note: focusNote,
          target: focusTarget,
        }),
      },
    );
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Unable to save focus override.");
      return;
    }

    setError("");
    if (savingForNextWeek) {
      setFocusSuccess(`Saved for next week. This week stays ${currentFocusLabel}.`);
      setFocusCueId(detail.focus.override?.cueId ?? "");
      setFocusNote(detail.focus.override?.note ?? "");
      setFocusTarget("this_week");
    } else {
      setFocusSuccess("");
    }

    await loadDetail(selectedWeek);
  };

  const editNextWeekOverride = () => {
    if (!detail?.focus.nextWeekOverride) {
      return;
    }
    setFocusSuccess("");
    setFocusCueId(detail.focus.nextWeekOverride.cueId);
    setFocusNote(detail.focus.nextWeekOverride.note);
    setFocusTarget("next_week");
  };

  const removeNextWeekOverride = async () => {
    if (!detail?.focus.nextWeekOverride) {
      return;
    }

    const response = await fetch(
      `/api/admin/program/enrollments/${enrollmentId}/focus-override?weekNumber=${detail.focus.nextWeekOverride.weekNumber}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Unable to remove next week focus.");
      return;
    }

    setFocusSuccess("");
    await loadDetail(selectedWeek);
  };

  const resetFocusOverride = async () => {
    if (!detail) {
      return;
    }
    const response = await fetch(
      `/api/admin/program/enrollments/${enrollmentId}/focus-override?weekNumber=${detail.focus.weekNumber}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Unable to reset focus.");
      return;
    }
    setFocusSuccess("");
    await loadDetail(selectedWeek);
  };

  const saveCustomTask = async () => {
    if (!taskForm) {
      return;
    }

    const payload = {
      programDay: taskForm.programDay,
      title: taskForm.title,
      target: taskForm.target,
      details: taskForm.details,
      drillIds: taskForm.drillIds,
      replacesTaskKey: taskForm.replacesTaskKey,
    };

    const response = taskForm.editingTaskId
      ? await fetch(
          `/api/admin/program/enrollments/${enrollmentId}/custom-tasks/${taskForm.editingTaskId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        )
      : await fetch(`/api/admin/program/enrollments/${enrollmentId}/custom-tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Unable to save custom task.");
      return;
    }

    setTaskForm(null);
    await loadDetail(selectedWeek);
  };

  const deleteCustomTask = async (taskId: string) => {
    const response = await fetch(
      `/api/admin/program/enrollments/${enrollmentId}/custom-tasks/${taskId}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Unable to delete custom task.");
      return;
    }
    await loadDetail(selectedWeek);
  };

  if (loading && !detail) {
    return <p className="text-sm text-zinc-400">Loading player...</p>;
  }

  if (!detail) {
    return <p className="text-sm text-red-300">{error || "Player not found."}</p>;
  }

  const currentCueLabel =
    detail.focus.override?.cueLabel ?? detail.focus.defaultCueLabel;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/program" className="text-sm font-semibold text-[#52B788]">
            Back to overview
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowSendVideo((current) => !current)}
              className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black"
            >
              Send video
            </button>
            <button
              type="button"
              disabled={openingMessage}
              onClick={() => {
                setOpeningMessage(true);
                void (async () => {
                  const response = await fetch("/api/admin/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ enrollmentId }),
                  });
                  const data = (await response.json().catch(() => ({}))) as {
                    conversationId?: string;
                  };
                  setOpeningMessage(false);
                  if (response.ok && data.conversationId) {
                    router.push(`/admin/messages/${data.conversationId}`);
                  }
                })();
              }}
              className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788] disabled:opacity-60"
            >
              {openingMessage ? "Opening..." : "Message"}
            </button>
          </div>
        </div>
        {showSendVideo ? (
          <div className="mt-4">
            <SendCoachVideoPanel
              userId={detail.enrollment.userId}
              enrollmentId={detail.enrollment.id}
              playerLabel={detail.enrollment.name ?? detail.enrollment.email}
              onClose={() => setShowSendVideo(false)}
              onSent={() => {
                void loadDetail(selectedWeek);
              }}
            />
          </div>
        ) : null}
        <h1 className="mt-3 text-2xl font-semibold text-zinc-100">
          {detail.enrollment.name ?? detail.enrollment.email}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{detail.enrollment.email}</p>
        {detail.enrollment.signedUpBy ? (
          <p className="mt-2 text-sm text-zinc-400">{detail.enrollment.signedUpBy}</p>
        ) : null}
        {detail.enrollment.accountRoleLabel ? (
          <p className="mt-1 text-sm text-zinc-500">
            Account role: {detail.enrollment.accountRoleLabel}
            {detail.enrollment.accountHolderName
              ? ` (${detail.enrollment.accountHolderName})`
              : ""}
          </p>
        ) : null}
        {detail.enrollment.refundLabel ? (
          <p className="mt-3 text-sm text-red-200">{detail.enrollment.refundLabel}</p>
        ) : null}
        <p className="mt-3 text-sm text-zinc-300">
          {WEEKDAY_NAMES[detail.schedule.dayOfWeek - 1] ?? "Day"} - Week{" "}
          {detail.schedule.weekNumber} of 12 . {detail.schedule.phase} . Streak {detail.streak}
        </p>
        {detail.enrollment.startDate ? (
          <p className="mt-1 text-sm text-zinc-400">Start date: {detail.enrollment.startDate}</p>
        ) : null}
        {detail.enrollment.knownFor ? (
          <p className="mt-3 text-sm italic text-zinc-300">
            &quot;{detail.enrollment.knownFor}&quot;
          </p>
        ) : null}
        <div className="mt-4 rounded-2xl border border-[#2b3650] bg-black/30 p-4 text-sm text-zinc-300">
          <p className="font-semibold text-zinc-100">Legal agreement</p>
          <p className="mt-2">
            Terms version: {detail.enrollment.legalAcceptance.termsVersion ?? "Not accepted"}
          </p>
          <p className="mt-1">
            Accepted: {detail.enrollment.legalAcceptance.termsAcceptedAtLabel}
          </p>
          {detail.enrollment.legalAcceptance.acceptedByName ? (
            <p className="mt-1">
              Agreed by: {detail.enrollment.legalAcceptance.acceptedByName} (
              {detail.enrollment.legalAcceptance.agreementRoleLabel})
            </p>
          ) : null}
          <p className="mt-1">
            Media consent: {detail.enrollment.legalAcceptance.mediaConsentLabel}
          </p>
          {detail.enrollment.legalAcceptance.parentConsentStatus ? (
            <p className="mt-1">{detail.enrollment.legalAcceptance.parentConsentStatus}</p>
          ) : null}
        </div>
        <div className="mt-4 rounded-2xl border border-[#2b3650] bg-black/30 p-4 text-sm text-zinc-300">
          <p className="font-semibold text-zinc-100">In-person training info</p>
          <p className="mt-2">
            Trains in person:{" "}
            {detail.enrollment.inPersonTraining.trainsInPerson ? "Yes" : "No"}
          </p>
          {detail.enrollment.inPersonTraining.trainsInPerson ? (
            <>
              <p className="mt-1">
                Emergency contact:{" "}
                {detail.enrollment.inPersonTraining.emergencyContactName &&
                detail.enrollment.inPersonTraining.emergencyContactPhone
                  ? `${detail.enrollment.inPersonTraining.emergencyContactName} (${detail.enrollment.inPersonTraining.emergencyContactPhone})`
                  : "Not set"}
              </p>
              <p className="mt-1">
                Medical notes:{" "}
                {detail.enrollment.inPersonTraining.medicalNotes?.trim() || "None"}
              </p>
            </>
          ) : null}
        </div>
        <div className="mt-4 rounded-2xl border border-[#2b3650] bg-black/30 p-4 text-sm text-zinc-300">
          <p className="font-semibold text-zinc-100">Videos sent</p>
          {detail.coachVideosSent.length === 0 ? (
            <p className="mt-2 text-zinc-400">No coach videos sent yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {detail.coachVideosSent.map((video) => (
                <li key={video.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{video.title}</span>
                  <span className="text-zinc-500">
                    {formatDateTime(video.createdAt)} |{" "}
                    {video.viewedAt ? "Watched" : "Not watched yet"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
          <p>Position: {detail.enrollment.position ?? "Not set"}</p>
          <p>Age group: {detail.enrollment.ageGroupLabel ?? "Not set"}</p>
          <p>Focus: {detail.enrollment.focusAreaLabels.join(", ") || "Not set"}</p>
          <p>Equipment: {detail.enrollment.equipmentLabels.join(", ") || "Not set"}</p>
          <p>Strength workouts: {detail.enrollment.strengthVariantLabel}</p>
          <p>
            Daily routine emails:{" "}
            {detail.enrollment.dailyRoutineEmailsEnabled ? "On" : "Off"}
          </p>
          <p>
            Second email:{" "}
            {detail.enrollment.parentEmail
              ? `${detail.enrollment.parentName ?? "Contact"} (${detail.enrollment.parentEmail})${
                  detail.enrollment.parentEmailsEnabled ? "" : ", emails off"
                }`
              : "Not set"}
          </p>
        </div>
      </section>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">Program settings</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void patchEnrollment({ seasonMode: "IN_SEASON" })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              detail.enrollment.seasonMode === "IN_SEASON"
                ? "bg-[#22c55e] text-[#0A1628]"
                : "border border-[#2b3650] text-zinc-300"
            }`}
          >
            In season
          </button>
          <button
            type="button"
            onClick={() => void patchEnrollment({ seasonMode: "OFF_SEASON" })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              detail.enrollment.seasonMode === "OFF_SEASON"
                ? "bg-[#22c55e] text-[#0A1628]"
                : "border border-[#2b3650] text-zinc-300"
            }`}
          >
            Off season
          </button>
        </div>
        <select
          value={detail.enrollment.ageGroup ?? ""}
          onChange={(event) =>
            void patchEnrollment({ ageGroup: event.target.value as ProgramAgeGroup })
          }
          className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-100"
        >
          <option value="">Select age group</option>
          {Object.entries(PROGRAM_AGE_GROUP_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {PROGRAM_FOCUS_AREAS.map((area) => {
            const active = detail.enrollment.focusAreas.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => {
                  const next = active
                    ? detail.enrollment.focusAreas.filter((item) => item !== area)
                    : [...detail.enrollment.focusAreas, area];
                  void patchEnrollment({ focusAreas: next });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-[#22c55e]/20 text-[#9df3bd]"
                    : "border border-[#2b3650] text-zinc-400"
                }`}
              >
                {PROGRAM_FOCUS_AREA_LABELS[area]}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {PROGRAM_EQUIPMENT_OPTIONS.map((item) => {
            const active = detail.enrollment.equipment.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  const next = active
                    ? detail.enrollment.equipment.filter((value) => value !== item)
                    : [...detail.enrollment.equipment, item];
                  void patchEnrollment({ equipment: next });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-[#22c55e]/20 text-[#9df3bd]"
                    : "border border-[#2b3650] text-zinc-400"
                }`}
              >
                {PROGRAM_EQUIPMENT_LABELS[item as ProgramEquipmentOption]}
              </button>
            );
          })}
        </div>
        <p className="text-sm font-medium text-zinc-300">Strength workout variant</p>
        <div className="flex flex-wrap gap-2">
          {STRENGTH_VARIANTS.map((variant) => {
            const active = detail.enrollment.strengthVariant === variant;
            return (
              <button
                key={variant}
                type="button"
                onClick={() => void patchEnrollment({ strengthVariant: variant })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-[#22c55e]/20 text-[#9df3bd]"
                    : "border border-[#2b3650] text-zinc-400"
                }`}
              >
                {STRENGTH_VARIANT_LABELS[variant as StrengthVariant]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">This week&apos;s focus</h2>
        <p className="text-sm text-zinc-300">
          Current focus: <span className="font-semibold text-[#9df3bd]">{currentCueLabel}</span>
        </p>
        {detail.focus.override?.note ? (
          <p className="text-sm text-zinc-400">{detail.focus.override.note}</p>
        ) : null}
        {detail.focus.nextWeekOverride ? (
          <div className="rounded-xl border border-[#2b3650] bg-black/20 p-3">
            <p className="text-sm text-zinc-300">
              Next week:{" "}
              <span className="font-semibold text-[#9df3bd]">
                {detail.focus.nextWeekOverride.cueLabel}
              </span>
            </p>
            {detail.focus.nextWeekOverride.note ? (
              <p className="mt-1 text-sm text-zinc-400">
                {firstNoteLine(detail.focus.nextWeekOverride.note)}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={editNextWeekOverride}
                className="text-xs font-semibold text-[#52B788]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void removeNextWeekOverride()}
                className="text-xs font-semibold text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ) : null}
        {focusSuccess ? <p className="text-sm text-[#9df3bd]">{focusSuccess}</p> : null}
        <label className="block text-sm font-semibold text-zinc-300">Hitting focus</label>
        <select
          value={focusCueId}
          onChange={(event) => setFocusCueId(event.target.value)}
          className="w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-100"
        >
          <option value="">Select hitting focus</option>
          {detail.cues.map((cue) => (
            <option key={cue.id} value={cue.id}>
              {cue.displayLabel}
            </option>
          ))}
        </select>
        <textarea
          value={focusNote}
          onChange={(event) => setFocusNote(event.target.value)}
          placeholder="What I saw and what to work on"
          maxLength={300}
          className="min-h-24 w-full rounded-xl border border-[#2b3650] bg-black/30 px-4 py-3 text-sm text-zinc-100"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFocusTarget("this_week")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              focusTarget === "this_week"
                ? "bg-[#22c55e] text-[#0A1628]"
                : "border border-[#2b3650] text-zinc-300"
            }`}
          >
            This week
          </button>
          {detail.focus.weekNumber < 12 ? (
            <button
              type="button"
              onClick={() => setFocusTarget("next_week")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                focusTarget === "next_week"
                  ? "bg-[#22c55e] text-[#0A1628]"
                  : "border border-[#2b3650] text-zinc-300"
              }`}
            >
              Next week
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void saveFocusOverride()}
            className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0A1628]"
          >
            Save focus
          </button>
          <button
            type="button"
            onClick={() => void resetFocusOverride()}
            className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Reset to default
          </button>
        </div>
      </section>

      {detail.stats && detail.stats.totals.games > 0 ? (
        <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">Stats</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["G", detail.stats.totals.games],
              ["AB", detail.stats.totals.atBats],
              ["H", detail.stats.totals.hits],
              ["2B", detail.stats.totals.doubles],
              ["3B", detail.stats.totals.triples],
              ["HR", detail.stats.totals.homeRuns],
              ["BB", detail.stats.totals.walks],
              ["HBP", detail.stats.totals.hitByPitch],
              ["R", detail.stats.totals.runs],
              ["RBI", detail.stats.totals.rbis],
              ["K", detail.stats.totals.strikeouts],
              ["SB", detail.stats.totals.stolenBases],
              ["E", detail.stats.totals.errors],
              ["AVG", detail.stats.totals.avg],
              ["OBP", detail.stats.totals.obp],
              ["SLG", detail.stats.totals.slg],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#2b3650] bg-black/20 px-3 py-2 text-center">
                <p className="text-xs font-bold text-zinc-500">{label}</p>
                <p className="mt-1 text-lg font-bold text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {detail.stats.gameLogs.map((log) => (
              <article key={log.id} className="rounded-xl border border-[#2b3650] bg-black/20 p-3">
                <p className="text-sm font-semibold text-zinc-100">
                  {log.weekdayLabel}
                  {log.opponent ? ` vs ${log.opponent}` : ""}
                </p>
                <p className="mt-1 text-sm text-[#9df3bd]">{log.line}</p>
                <p className="mt-2 text-sm text-zinc-400">{log.note}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">Week view</h2>
          <select
            value={selectedWeek}
            onChange={(event) => {
              const week = Number(event.target.value);
              setSelectedWeek(week);
              void loadDetail(week);
            }}
            className="rounded-xl border border-[#2b3650] bg-black/30 px-3 py-2 text-sm text-zinc-100"
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 space-y-4">
          {detail.weekDays.map((day) => {
            const weekdayName =
              "weekdayName" in day && typeof day.weekdayName === "string"
                ? day.weekdayName
                : WEEKDAY_NAMES[day.dayOfWeek - 1] ?? "";
            const isEditable =
              !day.isRestDay &&
              !("isNotStarted" in day && day.isNotStarted) &&
              day.programDay >= detail.schedule.programDay;
            const showForm = taskForm?.programDay === day.programDay;
            const practiceLog = detail.dayLogs?.find(
              (log) => log.programDay === day.programDay && log.type === "PRACTICE",
            );
            const gameLogsForDay =
              detail.dayLogs?.filter(
                (log) => log.programDay === day.programDay && log.type === "GAME",
              ) ?? [];

            return (
              <article key={day.programDay} className="rounded-xl border border-[#2b3650] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {weekdayName}
                    {"isNotStarted" in day && day.isNotStarted ? " . Not started yet" : ""}
                    {day.isRestDay ? " . Rest day" : ""}
                    {practiceLog ? (
                      <span className="ml-2 rounded-full bg-[#52B788]/15 px-2 py-0.5 text-xs font-semibold text-[#9df3bd]">
                        Practice
                      </span>
                    ) : null}
                  </h3>
                  {isEditable ? (
                    <button
                      type="button"
                      onClick={() => setTaskForm(emptyTaskForm(day.programDay))}
                      className="relative z-10 rounded-full border border-[#52B788] px-3 py-1.5 text-xs font-semibold text-[#52B788] touch-manipulation"
                    >
                      Add task
                    </button>
                  ) : null}
                </div>
                {!day.isRestDay ? (
                  <div className="mt-3 space-y-3">
                    {day.tasks.map((task) => {
                      const customTaskRecord = detail.customTasks.find(
                        (item) =>
                          item.programDay === day.programDay && task.key.endsWith(item.id),
                      );

                      return (
                        <div
                          key={task.key}
                          className="rounded-lg border border-[#18243a] bg-black/20 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-zinc-100">{task.title}</p>
                              <p className="mt-1 text-sm text-zinc-400">{task.target}</p>
                              {task.focus ? (
                                <p className="mt-1 text-xs text-[#52B788]">{task.focus}</p>
                              ) : null}
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                task.completed
                                  ? "bg-[#22c55e]/20 text-[#9df3bd]"
                                  : "bg-[#2b3650] text-zinc-400"
                              }`}
                            >
                              {task.completed ? "Done" : "Open"}
                            </span>
                          </div>
                          {task.note ? (
                            <p className="mt-2 text-sm text-zinc-300">{task.note}</p>
                          ) : null}
                          {task.completedAt ? (
                            <p className="mt-1 text-xs text-zinc-500">
                              Completed {formatDateTime(task.completedAt)}
                            </p>
                          ) : null}
                          {task.isCoachAdded && isEditable ? (
                            <div className="relative z-10 mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setTaskForm({
                                    programDay: day.programDay,
                                    title: task.title,
                                    target: task.target,
                                    details:
                                      customTaskRecord?.details ?? task.targetDetail ?? "",
                                    drillIds: customTaskRecord?.drillIds ?? [],
                                    replacesTaskKey: null,
                                    editingTaskId: customTaskRecord?.id ?? null,
                                  })
                                }
                                className="text-xs font-semibold text-[#52B788] touch-manipulation"
                              >
                                Edit
                              </button>
                              {customTaskRecord ? (
                                <button
                                  type="button"
                                  onClick={() => void deleteCustomTask(customTaskRecord.id)}
                                  className="text-xs font-semibold text-red-300 touch-manipulation"
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          ) : !task.isCoachAdded && isEditable ? (
                            <button
                              type="button"
                              onClick={() =>
                                setTaskForm({
                                  ...emptyTaskForm(day.programDay),
                                  replacesTaskKey: task.key,
                                })
                              }
                              className="relative z-10 mt-2 text-xs font-semibold text-[#52B788] touch-manipulation"
                            >
                              Replace
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                    {showForm && taskForm ? (
                      <CustomTaskForm
                        taskForm={taskForm}
                        setTaskForm={setTaskForm}
                        onSave={() => void saveCustomTask()}
                        onCancel={() => setTaskForm(null)}
                      />
                    ) : null}
                    {practiceLog ? (
                      <p className="text-sm text-zinc-400">Practice note: {practiceLog.note}</p>
                    ) : null}
                    {gameLogsForDay.map((log) => (
                      <p key={log.id} className="text-sm text-zinc-400">
                        Game note: {log.note}
                      </p>
                    ))}
                  </div>
                ) : null}
                {day.isRestDay && practiceLog ? (
                  <p className="mt-2 text-sm text-zinc-400">Practice note: {practiceLog.note}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">This week&apos;s submissions</h2>
        {detail.weekSubmissions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No submissions since Monday.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {detail.weekSubmissions.map((submission) => (
              <li key={`${submission.type}-${submission.id}`}>
                <Link href={submission.href} className="text-sm font-semibold text-[#52B788]">
                  {submission.type === "swing" ? "Swing analysis" : "Mental game"} #{submission.id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
