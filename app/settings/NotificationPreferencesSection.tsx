"use client";

import { useEffect, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import ToggleSwitch from "@/app/settings/ToggleSwitch";
import {
  settingsErrorMessageClass,
  settingsMutedTextClass,
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

const notificationOptions: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: "notifySubmissionResponse",
    label: "Coach Broc responds to a coaching submission",
    description: "Get notified when Coach Broc sends you feedback",
  },
  {
    key: "notifyGoalResponse",
    label: "Coach Broc responds to a goal check-in",
    description: "Get notified when Coach Broc responds to your monthly goals",
  },
  {
    key: "notifyWeeklyCheckin",
    label: "Weekly accountability check-in emails",
    description: "Receive your weekly check-in email from Coach Broc",
  },
  {
    key: "notifyAnnouncements",
    label: "Announcements about new content",
    description: "Be the first to know when new videos and programs are added",
  },
];

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

  const savePreferences = async (nextPreferences: NotificationPreferences) => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/settings/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextPreferences),
    });

    setIsSaving(false);

    const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to save notification preferences right now.");
      return;
    }

    setSuccessMessage("Preferences saved");
  };

  const handleToggle = (key: keyof NotificationPreferences, checked: boolean) => {
    const nextPreferences = { ...preferences, [key]: checked };
    setPreferences(nextPreferences);
    void savePreferences(nextPreferences);
  };

  if (isLoading) {
    return (
      <SettingsCard title="Notification Preferences">
        <p className={settingsMutedTextClass}>Loading preferences...</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard title="Notification Preferences">
      <div>
        {notificationOptions.map((option) => (
          <ToggleSwitch
            key={option.key}
            label={option.label}
            description={option.description}
            checked={preferences[option.key]}
            disabled={isSaving}
            onChange={(checked) => handleToggle(option.key, checked)}
          />
        ))}
      </div>

      {errorMessage ? <p className={`mt-4 ${settingsErrorMessageClass}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`mt-4 ${settingsSuccessMessageClass}`}>{successMessage}</p>
      ) : null}
    </SettingsCard>
  );
}
