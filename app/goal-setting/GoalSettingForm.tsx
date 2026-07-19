"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GOAL_FOCUS_AREAS } from "@/lib/goal-check-in";

export default function GoalSettingForm() {
  const router = useRouter();
  const [monthlyFocus, setMonthlyFocus] = useState("");
  const [lastMonthReview, setLastMonthReview] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setConfirmationMessage("");

    if (!monthlyFocus.trim() || !lastMonthReview.trim() || !focusArea) {
      setSubmitError("Please complete all required fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/goal-setting/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        monthlyFocus: monthlyFocus.trim(),
        lastMonthReview: lastMonthReview.trim(),
        focusArea,
        additionalNotes: additionalNotes.trim(),
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
    router.refresh();
  };

  if (confirmationMessage) {
    return (
      <div className="mt-6 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-5 sm:p-6">
        <p className="text-sm text-[#9df3bd] sm:text-base">{confirmationMessage}</p>
      </div>
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
