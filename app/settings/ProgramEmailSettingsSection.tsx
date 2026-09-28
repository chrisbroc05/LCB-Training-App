"use client";

import { useEffect, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import ToggleSwitch from "@/app/settings/ToggleSwitch";
import {
  settingsErrorMessageClass,
  settingsGreenButtonClass,
  settingsInputClass,
  settingsLabelClass,
  settingsMutedTextClass,
  settingsSectionTitleClass,
  settingsSuccessMessageClass,
} from "@/app/settings/settings-styles";

type ProgramEmailSettings = {
  dailyRoutineEmailsEnabled: boolean;
  parentName: string | null;
  parentEmail: string | null;
  parentEmailsEnabled: boolean;
};

export default function ProgramEmailSettingsSection() {
  const [settings, setSettings] = useState<ProgramEmailSettings | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [secondName, setSecondName] = useState("");
  const [secondEmail, setSecondEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSection, setShowSection] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const response = await fetch("/api/program/email-settings");
      setIsLoading(false);

      if (response.status === 404) {
        setShowSection(false);
        return;
      }

      if (!response.ok) {
        setErrorMessage("Unable to load program email settings right now.");
        return;
      }

      const data = (await response.json()) as {
        enrollment?: ProgramEmailSettings;
        accountEmail?: string;
      };
      if (!data.enrollment) {
        return;
      }

      setShowSection(true);
      setSettings(data.enrollment);
      setAccountEmail(data.accountEmail ?? "");
      setSecondName(data.enrollment.parentName ?? "");
      setSecondEmail(data.enrollment.parentEmail ?? "");
    };

    void loadSettings();
  }, []);

  const saveSettings = async (payload: Record<string, unknown>) => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/program/email-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      enrollment?: ProgramEmailSettings;
    };

    setIsSaving(false);

    if (!response.ok || !data.enrollment) {
      setErrorMessage(data.error ?? "Unable to save program email settings.");
      return false;
    }

    setSettings(data.enrollment);
    setSecondName(data.enrollment.parentName ?? "");
    setSecondEmail(data.enrollment.parentEmail ?? "");
    setSuccessMessage("Saved.");
    return true;
  };

  const savedSecondEmail = settings?.parentEmail?.trim() ?? "";
  const hasSavedSecondEmail = savedSecondEmail.length > 0;

  if (!showSection) {
    return null;
  }

  return (
    <SettingsCard
      id="program-emails"
      title="12-Week Program emails"
      description="Control daily routine emails and your second email contact."
    >
      {isLoading ? <p className={settingsMutedTextClass}>Loading...</p> : null}

      {!isLoading && settings ? (
        <div className="space-y-6">
          <ToggleSwitch
            label="Daily routine emails"
            description="Morning routine emails, Saturday video reminders, and gone-quiet nudges. Off if you use push notifications."
            checked={settings.dailyRoutineEmailsEnabled}
            disabled={isSaving}
            onChange={(checked) => {
              void saveSettings({ dailyRoutineEmailsEnabled: checked });
            }}
          />

          <div className="space-y-3 border-t border-[#2b3650] pt-6">
            <div>
              <h3 className={settingsSectionTitleClass}>Second email</h3>
              <p className={`mt-1 ${settingsMutedTextClass}`}>
                Add a parent email or your own if a parent signed you up. They get weekly recaps,
                check-in emails, and copies of Coach Broc video responses.
              </p>
              {accountEmail ? (
                <p className={`mt-1 ${settingsMutedTextClass}`}>
                  Your account email ({accountEmail}) cannot be used here.
                </p>
              ) : null}
            </div>

            <label className="block">
              <span className={settingsLabelClass}>Name (optional)</span>
              <input
                type="text"
                value={secondName}
                onChange={(event) => setSecondName(event.target.value)}
                className={settingsInputClass}
                placeholder="Optional"
              />
            </label>

            <label className="block">
              <span className={settingsLabelClass}>Second email (optional)</span>
              <input
                type="email"
                value={secondEmail}
                onChange={(event) => setSecondEmail(event.target.value)}
                className={settingsInputClass}
                placeholder="name@example.com"
              />
            </label>

            {hasSavedSecondEmail ? (
              <ToggleSwitch
                label="Second email enabled"
                description="Weekly recaps and program check-in emails."
                checked={settings.parentEmailsEnabled}
                disabled={isSaving}
                onChange={(checked) => {
                  void saveSettings({ parentEmailsEnabled: checked });
                }}
              />
            ) : (
              <p className={settingsMutedTextClass}>Add an email first.</p>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                const trimmedEmail = secondEmail.trim();
                void saveSettings({
                  parentName: secondName.trim() || null,
                  parentEmail: trimmedEmail || null,
                  ...(trimmedEmail ? {} : { parentEmailsEnabled: false }),
                });
              }}
              className={settingsGreenButtonClass}
            >
              {isSaving ? "Saving..." : "Save second email"}
            </button>
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className={settingsErrorMessageClass}>{errorMessage}</p> : null}
      {successMessage ? <p className={settingsSuccessMessageClass}>{successMessage}</p> : null}
    </SettingsCard>
  );
}
