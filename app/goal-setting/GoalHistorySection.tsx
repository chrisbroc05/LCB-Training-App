"use client";

import { useEffect, useState } from "react";
import GoalTrackerList from "@/app/goal-setting/GoalTrackerList";
import {
  isWithinCurrentMonthUtc,
  type SerializedGoalItem,
} from "@/lib/goal-check-in-constants";

type GoalHistoryEntry = {
  id: number;
  createdAt: string;
  monthlyFocus: string;
  lastMonthReview: string;
  focusAreaLabel: string;
  additionalNotes: string | null;
  coachResponse: string | null;
  status: string;
  respondedAt: string | null;
  goals: SerializedGoalItem[];
};

type GoalHistorySectionProps = {
  refreshKey?: number;
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

export default function GoalHistorySection({ refreshKey = 0 }: GoalHistorySectionProps) {
  const [entries, setEntries] = useState<GoalHistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [togglingGoalId, setTogglingGoalId] = useState<number | null>(null);

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
      setExpandedId((current) => {
        if (current && nextEntries.some((entry) => entry.id === current)) {
          return current;
        }

        return nextEntries[0]?.id ?? null;
      });
    };

    void loadHistory();
  }, [refreshKey]);

  const handleToggleGoal = async (entryId: number, goalId: number) => {
    setTogglingGoalId(goalId);

    const response = await fetch("/api/goal-checkin/complete-goal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goalItemId: goalId }),
    });

    setTogglingGoalId(null);

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as {
      goal?: {
        id: number;
        completed: boolean;
        completedAt: string | null;
      };
    };

    if (!data.goal) {
      return;
    }

    setEntries((previous) =>
      previous.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              goals: entry.goals.map((goal) =>
                goal.id === data.goal!.id
                  ? {
                      ...goal,
                      completed: data.goal!.completed,
                      completedAt: data.goal!.completedAt,
                    }
                  : goal,
              ),
            }
          : entry,
      ),
    );
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
                          togglingGoalId={togglingGoalId}
                          onToggleGoal={(goalId) => void handleToggleGoal(entry.id, goalId)}
                        />
                      </div>
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
