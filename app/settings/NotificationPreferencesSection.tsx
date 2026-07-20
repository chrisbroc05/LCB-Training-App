"use client";

import { useEffect, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import {
  settingsCheckboxLabelClass,
  settingsCheckboxOptionClass,
  settingsErrorMessageClass,
  settingsMutedTextClass,
  settingsPrimaryButtonClass,
  settingsSuccessMessageClass,
} from "@/app/settings/settings-styles";

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
      <SettingsCard title="Notification Preferences">
        <p className={settingsMutedTextClass}>Loading preferences...</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      title="Notification Preferences"
      description="Choose which email updates you want to receive from LCB Training."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className={settingsCheckboxOptionClass}>
          <input
            type="checkbox"
            checked={preferences.notifySubmissionResponse}
            onChange={() => togglePreference("notifySubmissionResponse")}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className={settingsCheckboxLabelClass}>
            Receive email when Coach Broc responds to a coaching submission
          </span>
        </label>

        <label className={settingsCheckboxOptionClass}>
          <input
            type="checkbox"
            checked={preferences.notifyGoalResponse}
            onChange={() => togglePreference("notifyGoalResponse")}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className={settingsCheckboxLabelClass}>
            Receive email when Coach Broc responds to a goal check-in
          </span>
        </label>

        <label className={settingsCheckboxOptionClass}>
          <input
            type="checkbox"
            checked={preferences.notifyWeeklyCheckin}
            onChange={() => togglePreference("notifyWeeklyCheckin")}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className={settingsCheckboxLabelClass}>
            Receive weekly accountability check-in emails from Coach Broc
          </span>
        </label>

        <label className={settingsCheckboxOptionClass}>
          <input
            type="checkbox"
            checked={preferences.notifyAnnouncements}
            onChange={() => togglePreference("notifyAnnouncements")}
            className="mt-1 h-4 w-4 accent-[#22c55e]"
          />
          <span className={settingsCheckboxLabelClass}>
            Receive announcements about new content and features
          </span>
        </label>

        {errorMessage ? <p className={settingsErrorMessageClass}>{errorMessage}</p> : null}
        {successMessage ? <p className={settingsSuccessMessageClass}>{successMessage}</p> : null}

        <button type="submit" disabled={isSaving} className={settingsPrimaryButtonClass}>
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </form>
    </SettingsCard>
  );
}
