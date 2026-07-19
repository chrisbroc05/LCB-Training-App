"use client";

import { useEffect, useState } from "react";
import { GOAL_FOCUS_AREAS, GOAL_ITEM_CATEGORIES, MAX_GOAL_ITEMS } from "@/lib/goal-check-in-constants";

type GoalRow = {
  category: string;
  description: string;
  targetValue: string;
};

type GoalSettingFormProps = {
  onSubmitted?: () => void;
};

function createEmptyGoalRow(): GoalRow {
  return {
    category: "",
    description: "",
    targetValue: "",
  };
}

export default function GoalSettingForm({ onSubmitted }: GoalSettingFormProps) {
  const [monthlyFocus, setMonthlyFocus] = useState("");
  const [lastMonthReview, setLastMonthReview] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [goalRows, setGoalRows] = useState<GoalRow[]>([createEmptyGoalRow()]);
  const [visibleGoalCount, setVisibleGoalCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [canSubmit, setCanSubmit] = useState(true);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  useEffect(() => {
    const loadAvailability = async () => {
      setIsLoadingAvailability(true);
      const response = await fetch("/api/goal-checkin/current-month");
      setIsLoadingAvailability(false);

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setCanSubmit(false);
        setBlockedMessage(data.error ?? "Unable to load goal check-in status right now.");
        return;
      }

      const data = (await response.json()) as {
        canSubmit?: boolean;
        message?: string | null;
      };

      setCanSubmit(Boolean(data.canSubmit));
      setBlockedMessage(data.canSubmit ? null : data.message ?? null);
    };

    void loadAvailability();
  }, [confirmationMessage]);

  const updateGoalRow = (index: number, field: keyof GoalRow, value: string) => {
    setGoalRows((previous) =>
      previous.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setConfirmationMessage("");

    if (!canSubmit) {
      return;
    }

    if (!monthlyFocus.trim() || !lastMonthReview.trim() || !focusArea) {
      setSubmitError("Please complete all required fields before submitting.");
      return;
    }

    const goals = goalRows
      .slice(0, visibleGoalCount)
      .map((row) => ({
        category: row.category.trim(),
        description: row.description.trim(),
        targetValue: row.targetValue.trim(),
      }))
      .filter((row) => row.category || row.description || row.targetValue);

    if (goals.length === 0) {
      setSubmitError("Please add at least one monthly goal.");
      return;
    }

    if (goals.some((goal) => !goal.category || !goal.description)) {
      setSubmitError("Each monthly goal needs a category and description.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/goal-checkin/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        monthlyFocus: monthlyFocus.trim(),
        lastMonthReview: lastMonthReview.trim(),
        focusArea,
        additionalNotes: additionalNotes.trim(),
        goals: goals.map((goal) => ({
          category: goal.category,
          description: goal.description,
          targetValue: goal.targetValue || undefined,
        })),
      }),
    });
    setIsSubmitting(false);

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      setSubmitError(data.error ?? "Unable to submit your goals right now.");
      return;
    }

    setConfirmationMessage(
      data.message ??
        "Your goals have been submitted. Coach Broc will review them and get back to you within 48 hours.",
    );
    setMonthlyFocus("");
    setLastMonthReview("");
    setFocusArea("");
    setAdditionalNotes("");
    setGoalRows([createEmptyGoalRow()]);
    setVisibleGoalCount(1);
    setCanSubmit(false);
    setBlockedMessage(
      "You have already submitted your goals for this month. Check back next month.",
    );
    onSubmitted?.();
  };

  if (isLoadingAvailability) {
    return <p className="mt-6 text-sm text-zinc-400">Loading goal check-in status...</p>;
  }

  if (confirmationMessage) {
    return (
      <div className="mt-6 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-5 sm:p-6">
        <p className="text-sm text-[#9df3bd] sm:text-base">{confirmationMessage}</p>
      </div>
    );
  }

  if (!canSubmit && blockedMessage) {
    return (
      <p className="mt-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
        {blockedMessage}
      </p>
    );
  }

  return (
    <form className="mt-6 space-y-5 sm:mt-8" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm text-zinc-300">What is your main focus and goal this month?</span>
        <textarea
          value={monthlyFocus}
          onChange={(event) => setMonthlyFocus(event.target.value)}
          rows={4}
          required
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-300">
          What did you work on last month and how did it go?
        </span>
        <textarea
          value={lastMonthReview}
          onChange={(event) => setLastMonthReview(event.target.value)}
          rows={4}
          required
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-300">
          What area do you most want to improve -- hitting, fielding, speed, strength, or mental game?
        </span>
        <select
          value={focusArea}
          onChange={(event) => setFocusArea(event.target.value)}
          required
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Select a focus area</option>
          {GOAL_FOCUS_AREAS.map((area) => (
            <option key={area} value={area}>
              {area === "mental game" ? "Mental Game" : area.charAt(0).toUpperCase() + area.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm text-zinc-300">
          Is there anything specific you want Coach Broc to know or focus on this month?
        </span>
        <textarea
          value={additionalNotes}
          onChange={(event) => setAdditionalNotes(event.target.value)}
          rows={4}
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-100">This Month's Goals</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Set up to 5 specific goals for this month. You can check them off as you accomplish them.
        </p>

        <div className="mt-4 space-y-4">
          {goalRows.slice(0, visibleGoalCount).map((row, index) => (
            <div
              key={`goal-row-${index}`}
              className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Goal {index + 1}
              </p>

              <label className="mt-3 block">
                <span className="text-sm text-zinc-300">Category</span>
                <select
                  value={row.category}
                  onChange={(event) => updateGoalRow(index, "category", event.target.value)}
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select a category</option>
                  {GOAL_ITEM_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block">
                <span className="text-sm text-zinc-300">Goal description</span>
                <input
                  type="text"
                  value={row.description}
                  onChange={(event) => updateGoalRow(index, "description", event.target.value)}
                  placeholder='e.g. "Reach 85 mph exit velocity"'
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="mt-3 block">
                <span className="text-sm text-zinc-300">Target value (optional)</span>
                <input
                  type="text"
                  value={row.targetValue}
                  onChange={(event) => updateGoalRow(index, "targetValue", event.target.value)}
                  placeholder='e.g. "85 mph" or "185 lbs" or ".350 average"'
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>
          ))}
        </div>

        {visibleGoalCount < MAX_GOAL_ITEMS ? (
          <button
            type="button"
            onClick={() => {
              setVisibleGoalCount((current) => {
                const nextCount = Math.min(MAX_GOAL_ITEMS, current + 1);
                setGoalRows((previous) => {
                  const nextRows = [...previous];
                  while (nextRows.length < nextCount) {
                    nextRows.push(createEmptyGoalRow());
                  }
                  return nextRows;
                });
                return nextCount;
              });
            }}
            disabled={isSubmitting}
            className="mt-4 rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add Another Goal
          </button>
        ) : null}
      </div>

      {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit My Goals"}
      </button>
    </form>
  );
}
