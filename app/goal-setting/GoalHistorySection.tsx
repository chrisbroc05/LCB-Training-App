"use client";

import { useEffect, useState } from "react";
import GoalTrackerList from "@/app/goal-setting/GoalTrackerList";
import type { EditSubmissionData } from "@/app/goal-setting/GoalSettingForm";
import {
  isWithinCurrentMonthUtc,
  type SerializedGoalItem,
} from "@/lib/goal-check-in-constants";

export type { EditSubmissionData };

type GoalHistoryEntry = {
  id: number;
  createdAt: string;
  monthlyFocus: string;
  lastMonthReview: string;
  focusArea: string;
  focusAreaLabel: string;
  additionalNotes: string | null;
  coachResponse: string | null;
  status: string;
  respondedAt: string | null;
  goals: SerializedGoalItem[];
};

type GoalHistorySectionProps = {
  refreshKey?: number;
  onEditSubmission?: (submission: EditSubmissionData) => void;
};

function formatMonthYear(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatResponseDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildSavedCompletionMap(entries: GoalHistoryEntry[]) {
  const saved: Record<number, boolean> = {};
  entries.forEach((entry) => {
    entry.goals.forEach((goal) => {
      saved[goal.id] = goal.completed;
    });
  });
  return saved;
}

function StatusBadge({ status }: { status: string }) {
  const isPending = status === "pending";

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        isPending ? "bg-[#24314a] text-zinc-200" : "bg-[#22c55e]/20 text-[#9df3bd]"
      }`}
    >
      {isPending ? "Pending" : "Responded"}
    </span>
  );
}

export default function GoalHistorySection({
  refreshKey = 0,
  onEditSubmission,
}: GoalHistorySectionProps) {
  const [entries, setEntries] = useState<GoalHistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savedCompletionByGoalId, setSavedCompletionByGoalId] = useState<Record<number, boolean>>(
    {},
  );
  const [hasUnsavedGoalChanges, setHasUnsavedGoalChanges] = useState(false);
  const [isSavingGoals, setIsSavingGoals] = useState(false);
  const [saveProgressMessage, setSaveProgressMessage] = useState("");
  const [saveProgressError, setSaveProgressError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setLoadError("");

      const response = await fetch("/api/goal-checkin/history");
      setIsLoading(false);

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setLoadError(data.error ?? "Unable to load goal history right now.");
        setEntries([]);
        return;
      }

      const data = (await response.json()) as { entries?: GoalHistoryEntry[] };
      const nextEntries = data.entries ?? [];
      setEntries(nextEntries);
      setSavedCompletionByGoalId(buildSavedCompletionMap(nextEntries));
      setHasUnsavedGoalChanges(false);
      setSaveProgressMessage("");
      setSaveProgressError("");
      setExpandedId((current) => {
        if (current && nextEntries.some((entry) => entry.id === current)) {
          return current;
        }

        return nextEntries[0]?.id ?? null;
      });
    };

    void loadHistory();
  }, [refreshKey]);

  const handleToggleGoalLocal = (entryId: number, goalId: number) => {
    setSaveProgressMessage("");
    setSaveProgressError("");

    setEntries((previous) =>
      previous.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              goals: entry.goals.map((goal) => {
                if (goal.id !== goalId) {
                  return goal;
                }

                const nextCompleted = !goal.completed;
                return {
                  ...goal,
                  completed: nextCompleted,
                  completedAt: nextCompleted ? new Date().toISOString() : null,
                };
              }),
            }
          : entry,
      ),
    );
    setHasUnsavedGoalChanges(true);
  };

  const handleSaveGoalProgress = async (entry: GoalHistoryEntry) => {
    const changedGoals = entry.goals.filter(
      (goal) => goal.completed !== savedCompletionByGoalId[goal.id],
    );

    if (changedGoals.length === 0) {
      setHasUnsavedGoalChanges(false);
      return;
    }

    setIsSavingGoals(true);
    setSaveProgressMessage("");
    setSaveProgressError("");

    for (const goal of changedGoals) {
      const response = await fetch("/api/goal-checkin/complete-goal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalItemId: goal.id,
          completed: goal.completed,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setIsSavingGoals(false);
        setSaveProgressError(data.error ?? "Unable to save goal progress right now.");
        return;
      }

      const data = (await response.json()) as {
        goal?: {
          id: number;
          completed: boolean;
          completedAt: string | null;
        };
      };

      if (data.goal) {
        setEntries((previous) =>
          previous.map((currentEntry) =>
            currentEntry.id === entry.id
              ? {
                  ...currentEntry,
                  goals: currentEntry.goals.map((currentGoal) =>
                    currentGoal.id === data.goal!.id
                      ? {
                          ...currentGoal,
                          completed: data.goal!.completed,
                          completedAt: data.goal!.completedAt,
                        }
                      : currentGoal,
                  ),
                }
              : currentEntry,
          ),
        );
      }
    }

    setSavedCompletionByGoalId((previous) => {
      const next = { ...previous };
      changedGoals.forEach((goal) => {
        next[goal.id] = goal.completed;
      });
      return next;
    });
    setHasUnsavedGoalChanges(false);
    setIsSavingGoals(false);
    setSaveProgressMessage("Progress saved.");
  };

  const handleEditSubmission = (entry: GoalHistoryEntry) => {
    onEditSubmission?.({
      id: entry.id,
      monthlyFocus: entry.monthlyFocus,
      lastMonthReview: entry.lastMonthReview,
      focusArea: entry.focusArea,
      additionalNotes: entry.additionalNotes,
      goals: entry.goals.map((goal) => ({
        category: goal.category,
        description: goal.description,
        targetValue: goal.targetValue,
      })),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <section className="mt-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h2 className="text-xl font-semibold text-zinc-100">Goal History</h2>
        <p className="mt-4 text-sm text-zinc-400">Loading goal history...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="mt-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h2 className="text-xl font-semibold text-zinc-100">Goal History</h2>
        <p className="mt-4 text-sm text-red-300">{loadError}</p>
      </section>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h2 className="text-xl font-semibold text-zinc-100">Goal History</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Review your past monthly goal check-ins and Coach Broc's responses.
      </p>

      <div className="mt-5 space-y-3">
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const isCurrentMonth = isWithinCurrentMonthUtc(entry.createdAt);
          const canEditSubmission =
            isCurrentMonth && entry.status === "pending" && !entry.coachResponse;

          return (
            <article
              key={entry.id}
              className={`overflow-hidden rounded-xl border transition ${
                isExpanded
                  ? "border-[#22c55e]/60 bg-[#22c55e]/10"
                  : "border-[#2b3650] bg-black/30 hover:border-[#3c4a68]"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
                aria-expanded={isExpanded}
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {formatMonthYear(entry.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{entry.focusAreaLabel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={entry.status} />
                  <span className="text-sm text-zinc-400">{isExpanded ? "-" : "+"}</span>
                </div>
              </button>

              {isExpanded ? (
                <div className="border-t border-[#2b3650]/80 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                  <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
                    <p className="text-sm font-semibold text-zinc-100">Your Submission</p>
                    <div className="mt-3 space-y-3 text-sm text-zinc-300">
                      <div>
                        <p className="font-semibold text-zinc-100">
                          What is your main focus and goal this month?
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{entry.monthlyFocus}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-100">
                          What did you work on last month and how did it go?
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{entry.lastMonthReview}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-100">
                          What area do you most want to improve?
                        </p>
                        <p className="mt-1">{entry.focusAreaLabel}</p>
                      </div>
                      {entry.additionalNotes ? (
                        <div>
                          <p className="font-semibold text-zinc-100">
                            Is there anything specific you want Coach Broc to know or focus on this
                            month?
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{entry.additionalNotes}</p>
                        </div>
                      ) : null}
                    </div>

                    {canEditSubmission ? (
                      <button
                        type="button"
                        onClick={() => handleEditSubmission(entry)}
                        className="mt-4 text-sm font-semibold text-[#98b144] underline-offset-2 hover:underline"
                      >
                        Edit Submission
                      </button>
                    ) : null}
                  </div>

                  {entry.goals.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-zinc-100">Monthly Goal Tracker</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {isCurrentMonth
                          ? "Check off each goal as you complete it this month."
                          : "Past month goals are shown read-only."}
                      </p>
                      <div className="mt-3">
                        <GoalTrackerList
                          goals={entry.goals}
                          interactive={isCurrentMonth}
                          onToggleGoal={
                            isCurrentMonth
                              ? (goalId) => handleToggleGoalLocal(entry.id, goalId)
                              : undefined
                          }
                        />
                      </div>

                      {isCurrentMonth && hasUnsavedGoalChanges ? (
                        <div className="mt-4 space-y-3">
                          <button
                            type="button"
                            onClick={() => void handleSaveGoalProgress(entry)}
                            disabled={isSavingGoals}
                            className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSavingGoals ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      ) : null}

                      {saveProgressMessage ? (
                        <p className="mt-3 rounded-lg border border-[#22c55e]/40 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#9df3bd]">
                          {saveProgressMessage}
                        </p>
                      ) : null}

                      {saveProgressError ? (
                        <p className="mt-3 text-sm text-red-300">{saveProgressError}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {entry.coachResponse ? (
                    <div className="mt-4 rounded-xl border border-[#2b3650] border-l-4 border-l-[#52B788] bg-[#0f1d34] p-4">
                      <p className="text-sm font-semibold text-[#9df3bd]">Coach Broc's Response</p>
                      {entry.respondedAt ? (
                        <p className="mt-1 text-xs text-zinc-400">
                          Responded {formatResponseDate(entry.respondedAt)}
                        </p>
                      ) : null}
                      <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-100">
                        {entry.coachResponse}
                      </p>
                    </div>
                  ) : entry.status === "pending" ? (
                    <p className="mt-4 text-sm text-zinc-400">
                      Coach Broc is reviewing your goals and will respond within 48 hours.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
