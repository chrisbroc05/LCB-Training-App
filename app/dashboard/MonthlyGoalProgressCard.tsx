"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function MonthlyGoalProgressCard({
  hasCheckin,
  goals: initialGoals,
}: MonthlyGoalProgressCardProps) {
  const [goals, setGoals] = useState<SerializedGoalItem[]>(() =>
    initialGoals.map(serializeGoalItem),
  );
  const [togglingGoalId, setTogglingGoalId] = useState<number | null>(null);

  const completedCount = goals.filter((goal) => goal.completed).length;
  const totalCount = goals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const handleToggleGoal = async (goalId: number) => {
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

    setGoals((previous) =>
      previous.map((goal) =>
        goal.id === data.goal!.id
          ? {
              ...goal,
              completed: data.goal!.completed,
              completedAt: data.goal!.completedAt,
            }
          : goal,
      ),
    );
  };

  if (!hasCheckin || totalCount === 0) {
    return (
      <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">This Month's Goals</h2>
        <p className="mt-3 text-sm text-zinc-300">No goals set this month</p>
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
          togglingGoalId={togglingGoalId}
          onToggleGoal={(goalId) => void handleToggleGoal(goalId)}
        />
      </div>
    </article>
  );
}
