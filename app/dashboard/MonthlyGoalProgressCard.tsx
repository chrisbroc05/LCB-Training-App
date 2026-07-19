"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GoalTrackerList from "@/app/goal-setting/GoalTrackerList";
import {
  serializeGoalItem,
  type SerializedGoalItem,
} from "@/lib/goal-check-in-constants";

type MonthlyGoalProgressCardProps = {
  hasCheckin: boolean;
  goals: Array<{
    id: number;
    category: string;
    description: string;
    targetValue: string | null;
    completed: boolean;
    completedAt: Date | null;
  }>;
};

function buildSavedCompletionMap(goals: SerializedGoalItem[]) {
  const saved: Record<number, boolean> = {};
  goals.forEach((goal) => {
    saved[goal.id] = goal.completed;
  });
  return saved;
}

export default function MonthlyGoalProgressCard({
  hasCheckin,
  goals: initialGoals,
}: MonthlyGoalProgressCardProps) {
  const [goals, setGoals] = useState<SerializedGoalItem[]>(() =>
    initialGoals.map(serializeGoalItem),
  );
  const [savedCompletionByGoalId, setSavedCompletionByGoalId] = useState<Record<number, boolean>>(
    () => buildSavedCompletionMap(initialGoals.map(serializeGoalItem)),
  );
  const [hasUnsavedGoalChanges, setHasUnsavedGoalChanges] = useState(false);
  const [isSavingGoals, setIsSavingGoals] = useState(false);
  const [saveProgressMessage, setSaveProgressMessage] = useState("");
  const [saveMessageVisible, setSaveMessageVisible] = useState(false);
  const [saveProgressError, setSaveProgressError] = useState("");

  const completedCount = goals.filter((goal) => goal.completed).length;
  const totalCount = goals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  useEffect(() => {
    if (!saveProgressMessage) {
      return;
    }

    setSaveMessageVisible(true);
    const fadeTimer = window.setTimeout(() => setSaveMessageVisible(false), 2500);
    const clearTimer = window.setTimeout(() => setSaveProgressMessage(""), 3000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [saveProgressMessage]);

  const handleToggleGoalLocal = (goalId: number) => {
    setSaveProgressMessage("");
    setSaveProgressError("");
    setSaveMessageVisible(false);

    setGoals((previous) =>
      previous.map((goal) => {
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
    );
    setHasUnsavedGoalChanges(true);
  };

  const handleSaveGoalProgress = async () => {
    const changedGoals = goals.filter(
      (goal) => goal.completed !== savedCompletionByGoalId[goal.id],
    );

    if (changedGoals.length === 0) {
      setHasUnsavedGoalChanges(false);
      return;
    }

    setIsSavingGoals(true);
    setSaveProgressMessage("");
    setSaveProgressError("");
    setSaveMessageVisible(false);

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
        setGoals((previous) =>
          previous.map((currentGoal) =>
            currentGoal.id === data.goal!.id
              ? {
                  ...currentGoal,
                  completed: data.goal!.completed,
                  completedAt: data.goal!.completedAt,
                }
              : currentGoal,
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
    setSaveProgressMessage("Progress saved");
  };

  if (!hasCheckin || totalCount === 0) {
    return (
      <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">This Month's Goals</h2>
        <p className="mt-3 text-sm text-zinc-300">
          You have not set your goals for this month yet.
        </p>
        <Link
          href="/goal-setting"
          className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Set Your Monthly Goals
        </Link>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">This Month's Goals</h2>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-zinc-300">
            {completedCount} of {totalCount} goals completed
          </p>
          <p className="font-semibold text-[#9df3bd]">{progressPercent}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a253a]">
          <div
            className="h-full rounded-full bg-[#22c55e] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {allCompleted ? (
        <p className="mt-4 rounded-lg border border-[#22c55e]/40 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#9df3bd]">
          All goals completed this month. Great work!
        </p>
      ) : null}

      <div className="mt-4">
        <GoalTrackerList
          goals={goals}
          interactive
          onToggleGoal={handleToggleGoalLocal}
        />
      </div>

      {hasUnsavedGoalChanges ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void handleSaveGoalProgress()}
            disabled={isSavingGoals}
            className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingGoals ? "Saving..." : "Save Changes"}
          </button>
        </div>
      ) : null}

      {saveProgressMessage ? (
        <p
          className={`mt-3 text-sm text-[#9df3bd] transition-opacity duration-500 ${
            saveMessageVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {saveProgressMessage}
        </p>
      ) : null}

      {saveProgressError ? (
        <p className="mt-3 text-sm text-red-300">{saveProgressError}</p>
      ) : null}

      <Link
        href="/goal-setting"
        className="mt-4 inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144]"
      >
        View Full Check-In
      </Link>
    </article>
  );
}
