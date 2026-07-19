"use client";

import { useState } from "react";
import GoalHistorySection from "@/app/goal-setting/GoalHistorySection";
import GoalSettingForm, { type EditSubmissionData } from "@/app/goal-setting/GoalSettingForm";

export default function GoalSettingPageBody() {
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [editSubmission, setEditSubmission] = useState<EditSubmissionData | null>(null);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Monthly Goal Check-In
        </h1>
        <p className="mt-2 text-zinc-300">
          Submit your monthly goals and Coach Broc will personally review them and respond within 48
          hours.
        </p>

        <GoalSettingForm
          editSubmission={editSubmission}
          onCancelEdit={() => setEditSubmission(null)}
          onSubmitted={() => {
            setEditSubmission(null);
            setHistoryRefreshKey((current) => current + 1);
          }}
        />
      </section>

      <GoalHistorySection
        refreshKey={historyRefreshKey}
        onEditSubmission={setEditSubmission}
      />
    </div>
  );
}
