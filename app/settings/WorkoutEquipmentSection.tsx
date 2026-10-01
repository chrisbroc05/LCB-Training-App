"use client";

import { useEffect, useState } from "react";
import SettingsCard from "@/app/settings/SettingsCard";
import {
  settingsErrorMessageClass,
  settingsMutedTextClass,
  settingsSuccessMessageClass,
} from "@/app/settings/settings-styles";
import {
  resolveStrengthVariant,
  STRENGTH_VARIANT_LABELS,
  STRENGTH_VARIANTS,
  type StrengthVariant,
} from "@/lib/strength-variant-shared";
import type { ProgramEquipmentOption } from "@/lib/program-enrollment-shared";

type EnrollmentSettings = {
  equipment: string[];
  strengthVariant: string | null;
};

export default function WorkoutEquipmentSection() {
  const [enrollment, setEnrollment] = useState<EnrollmentSettings | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<StrengthVariant>("bodyweight");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSection, setShowSection] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const response = await fetch("/api/program/strength-variant");
      setIsLoading(false);

      if (response.status === 403 || response.status === 404) {
        setShowSection(false);
        return;
      }

      if (!response.ok) {
        setErrorMessage("Unable to load workout equipment settings right now.");
        return;
      }

      const data = (await response.json()) as { enrollment?: EnrollmentSettings };
      if (!data.enrollment) {
        return;
      }

      setShowSection(true);
      setEnrollment(data.enrollment);
      setSelectedVariant(
        resolveStrengthVariant({
          strengthVariant: data.enrollment.strengthVariant as StrengthVariant | null,
          equipment: data.enrollment.equipment as ProgramEquipmentOption[],
        }),
      );
    };

    void loadSettings();
  }, []);

  const saveVariant = async (variant: StrengthVariant) => {
    setSelectedVariant(variant);
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/program/strength-variant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strengthVariant: variant }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setIsSaving(false);

    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to save workout equipment.");
      return;
    }

    setSuccessMessage("Workout equipment updated. Future strength workouts will use this option.");
  };

  if (isLoading || !showSection) {
    return null;
  }

  return (
    <SettingsCard
      id="workout-equipment"
      title="Workout equipment"
      description="Choose which strength workouts you get. This changes future strength workouts only."
    >
      <div className="flex flex-wrap gap-2">
        {STRENGTH_VARIANTS.map((variant) => {
          const active = selectedVariant === variant;
          return (
            <button
              key={variant}
              type="button"
              disabled={isSaving}
              onClick={() => void saveVariant(variant)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[#22c55e]/20 text-[#9df3bd]"
                  : "border border-[#2b3650] text-zinc-300 hover:border-[#52B788]/60"
              }`}
            >
              {STRENGTH_VARIANT_LABELS[variant]}
            </button>
          );
        })}
      </div>
      {errorMessage ? <p className={settingsErrorMessageClass}>{errorMessage}</p> : null}
      {successMessage ? <p className={settingsSuccessMessageClass}>{successMessage}</p> : null}
      {isSaving ? (
        <p className={`${settingsMutedTextClass} mt-2`}>Saving...</p>
      ) : (
        <p className={`${settingsMutedTextClass} mt-2`}>
          Current: {STRENGTH_VARIANT_LABELS[selectedVariant]}
        </p>
      )}
    </SettingsCard>
  );
}
