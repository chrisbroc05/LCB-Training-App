"use client";

import { useEffect, useState } from "react";

type NotificationPreferences = {
  notifySubmissionResponse: boolean;
  notifyGoalResponse: boolean;
  notifyWeeklyCheckin: boolean;
  notifyAnnouncements: boolean;
};

const defaultPreferences: NotificationPreferences = {
  notifySubmissionResponse: true,
  notifyGoalResponse: true,
  notifyWeeklyCheckin: true,
  notifyAnnouncements: true,
};

export default function NotificationPreferencesSection() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      const response = await fetch("/api/settings/notifications");
      setIsLoading(false);

      if (!response.ok) {
        setErrorMessage("Unable to load notification preferences right now.");
        return;
      }

      const data = (await response.json()) as { preferences?: NotificationPreferences };
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    };

    void loadPreferences();
  }, []);

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/settings/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferences),
    });

    setIsSaving(false);

    const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to save notification preferences right now.");
      return;
    }

    setSuccessMessage(data.message ?? "Preferences saved");
  };

  if (isLoading) {
    return (
      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Notification Preferences</h2>
        <p className="mt-4 text-sm text-zinc-400">Loading preferences...</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Notification Preferences</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Choose which email updates you want to receive from LCB Training.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="flex items-start gap-3 rounded-xl border border-[#2b3650] bg-black/30 p-4">
          <input
            type="checkbox"
            checked={preferences.notifySubmissionResponse}
            onChange={() => togglePreference("notifySubmissionResponse")}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className="text-sm text-zinc-200">
            Receive email when Coach Broc responds to a coaching submission
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-[#2b3650] bg-black/30 p-4">
          <input
            type="checkbox"
            checked={preferences.notifyGoalResponse}
            onChange={() => togglePreference("notifyGoalResponse")}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className="text-sm text-zinc-200">
            Receive email when Coach Broc responds to a goal check-in
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-[#2b3650] bg-black/30 p-4">
          <input
            type="checkbox"
            checked={preferences.notifyWeeklyCheckin}
            onChange={() => togglePreference("notifyWeeklyCheckin")}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className="text-sm text-zinc-200">
            Receive weekly accountability check-in emails from Coach Broc
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-[#2b3650] bg-black/30 p-4">
          <input
            type="checkbox"
            checked={preferences.notifyAnnouncements}
            onChange={() => togglePreference("notifyAnnouncements")}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className="text-sm text-zinc-200">
            Receive announcements about new content and features
          </span>
        </label>

        {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
        {successMessage ? (
          <p className="text-sm text-[#9df3bd]">{successMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </form>
    </section>
  );
}
