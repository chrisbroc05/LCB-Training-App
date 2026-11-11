"use client";

import { useEffect, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import ToggleSwitch from "@/app/settings/ToggleSwitch";
import {
  settingsErrorMessageClass,
  settingsMutedTextClass,
  settingsSuccessMessageClass,
} from "@/app/settings/settings-styles";

export default function LeaderboardPrivacySection() {
  const [hideFromLeaderboards, setHideFromLeaderboards] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const response = await fetch("/api/settings/leaderboard");
      setIsLoading(false);
      if (!response.ok) {
        setErrorMessage("Unable to load leaderboard setting.");
        return;
      }
      const data = (await response.json()) as { hideFromLeaderboards?: boolean };
      setHideFromLeaderboards(Boolean(data.hideFromLeaderboards));
    };
    void load();
  }, []);

  const save = async (next: boolean) => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    const response = await fetch("/api/settings/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hideFromLeaderboards: next }),
    });
    setIsSaving(false);
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to save.");
      return;
    }
    setHideFromLeaderboards(next);
    setSuccessMessage("Preference saved");
  };

  if (isLoading) {
    return (
      <SettingsCard title="Leaderboards">
        <p className={settingsMutedTextClass}>Loading...</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard title="Leaderboards">
      <ToggleSwitch
        checked={hideFromLeaderboards}
        disabled={isSaving}
        onChange={(checked) => void save(checked)}
        label="Hide my player from leaderboards"
        description="Parents can turn this on for minors. Hidden players still complete challenges; they just do not appear on rankings."
      />
      {errorMessage ? <p className={`mt-3 ${settingsErrorMessageClass}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`mt-3 ${settingsSuccessMessageClass}`}>{successMessage}</p>
      ) : null}
    </SettingsCard>
  );
}
