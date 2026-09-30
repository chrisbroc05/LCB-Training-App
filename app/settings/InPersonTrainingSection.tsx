"use client";

import { useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import { settingsLabelClass } from "@/app/settings/settings-styles";
import { formatDateTime } from "@/lib/format-date";
import type { InPersonTrainingInfo } from "@/lib/in-person-training-shared";

type InPersonTrainingSectionProps = {
  initialInfo: InPersonTrainingInfo;
};

export default function InPersonTrainingSection({ initialInfo }: InPersonTrainingSectionProps) {
  const [trainsInPerson, setTrainsInPerson] = useState(initialInfo.trainsInPerson);
  const [emergencyContactName, setEmergencyContactName] = useState(
    initialInfo.emergencyContactName ?? "",
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    initialInfo.emergencyContactPhone ?? "",
  );
  const [medicalNotes, setMedicalNotes] = useState(initialInfo.medicalNotes ?? "");
  const [updatedAt, setUpdatedAt] = useState(initialInfo.inPersonInfoUpdatedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/settings/in-person-training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trainsInPerson,
        emergencyContactName,
        emergencyContactPhone,
        medicalNotes,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      info?: InPersonTrainingInfo;
    };

    if (!response.ok || !data.info) {
      setError(data.error ?? "Unable to save in-person training info.");
      setSaving(false);
      return;
    }

    setTrainsInPerson(data.info.trainsInPerson);
    setEmergencyContactName(data.info.emergencyContactName ?? "");
    setEmergencyContactPhone(data.info.emergencyContactPhone ?? "");
    setMedicalNotes(data.info.medicalNotes ?? "");
    setUpdatedAt(data.info.inPersonInfoUpdatedAt);
    setSuccess("In-person training info saved.");
    setSaving(false);
  };

  return (
    <SettingsCard
      id="in-person-training"
      title="In-person training info"
      description="If you also train with Coach Broc in person, keep your emergency contact and medical notes up to date."
    >
      <div className="space-y-4">
        <fieldset className="space-y-3">
          <legend className={`${settingsLabelClass} mb-2`}>
            Will you also train with Coach Broc in person (lessons or team)?
          </legend>
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            <input
              type="radio"
              name="trainsInPerson"
              checked={trainsInPerson}
              onChange={() => setTrainsInPerson(true)}
            />
            Yes
          </label>
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            <input
              type="radio"
              name="trainsInPerson"
              checked={!trainsInPerson}
              onChange={() => setTrainsInPerson(false)}
            />
            No
          </label>
        </fieldset>

        {trainsInPerson ? (
          <>
            <label className="block space-y-2 text-sm text-zinc-300">
              <span className={settingsLabelClass}>Emergency contact name</span>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(event) => setEmergencyContactName(event.target.value)}
                className="w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
              />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className={settingsLabelClass}>Emergency contact phone</span>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(event) => setEmergencyContactPhone(event.target.value)}
                className="w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
              />
            </label>

            <label className="block space-y-2 text-sm text-zinc-300">
              <span className={settingsLabelClass}>
                Medical conditions, injuries, or allergies (optional)
              </span>
              <textarea
                rows={4}
                value={medicalNotes}
                onChange={(event) => setMedicalNotes(event.target.value)}
                className="w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
              />
            </label>
          </>
        ) : null}

        {updatedAt ? (
          <p className="text-sm text-zinc-400">Last updated {formatDateTime(updatedAt)}</p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-[#22c55e] px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-[#52B788]">{success}</p> : null}
      </div>
    </SettingsCard>
  );
}
