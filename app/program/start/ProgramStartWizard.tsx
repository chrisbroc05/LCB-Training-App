"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ProgramAgeGroup, ProgramSeasonMode } from "@prisma/client";
import {
  PROGRAM_AGE_GROUP_LABELS,
  PROGRAM_EQUIPMENT_LABELS,
  PROGRAM_EQUIPMENT_OPTIONS,
  PROGRAM_FOCUS_AREA_LABELS,
  PROGRAM_FOCUS_AREAS,
  PROGRAM_POSITION_OPTIONS,
  type ProgramEquipmentOption,
  type ProgramFocusArea,
} from "@/lib/program-enrollment";
import { formatProgramStartLabel, parseProgramDateKey } from "@/lib/program-schedule";

type SerializedEnrollment = {
  ageGroup: ProgramAgeGroup | null;
  position: string | null;
  focusAreas: string[];
  equipment: string[];
  seasonMode: ProgramSeasonMode | null;
  knownFor: string | null;
  startDate: string | null;
  onboardingCompletedAt: string | null;
};

type WizardStep =
  | "intro"
  | "age"
  | "position"
  | "focus"
  | "equipment"
  | "season"
  | "known_for"
  | "start_date"
  | "confirmation";

const STEP_ORDER: WizardStep[] = [
  "intro",
  "age",
  "position",
  "focus",
  "equipment",
  "season",
  "known_for",
  "start_date",
  "confirmation",
];

function getResumeStep(enrollment: SerializedEnrollment): WizardStep {
  if (!enrollment.ageGroup) {
    return "intro";
  }

  if (!enrollment.position) {
    return "position";
  }

  if (enrollment.focusAreas.length === 0) {
    return "focus";
  }

  if (enrollment.equipment.length === 0) {
    return "equipment";
  }

  if (!enrollment.seasonMode) {
    return "season";
  }

  if (!enrollment.knownFor) {
    return "known_for";
  }

  if (!enrollment.startDate) {
    return "start_date";
  }

  return "confirmation";
}

type ProgramStartWizardProps = {
  firstName: string;
  initialEnrollment: SerializedEnrollment;
  checkoutSuccess: boolean;
};

export default function ProgramStartWizard({
  firstName,
  initialEnrollment,
  checkoutSuccess,
}: ProgramStartWizardProps) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [step, setStep] = useState<WizardStep>(() => getResumeStep(initialEnrollment));
  const [ageGroup, setAgeGroup] = useState<ProgramAgeGroup | null>(initialEnrollment.ageGroup);
  const [position, setPosition] = useState<string | null>(initialEnrollment.position);
  const [focusAreas, setFocusAreas] = useState<ProgramFocusArea[]>(
    initialEnrollment.focusAreas.filter((value): value is ProgramFocusArea =>
      PROGRAM_FOCUS_AREAS.includes(value as ProgramFocusArea),
    ),
  );
  const [equipment, setEquipment] = useState<ProgramEquipmentOption[]>(
    initialEnrollment.equipment.filter((value): value is ProgramEquipmentOption =>
      PROGRAM_EQUIPMENT_OPTIONS.includes(value as ProgramEquipmentOption),
    ),
  );
  const [seasonMode, setSeasonMode] = useState<ProgramSeasonMode | null>(initialEnrollment.seasonMode);
  const [knownFor, setKnownFor] = useState(initialEnrollment.knownFor ?? "");
  const [startDate, setStartDate] = useState<string | null>(initialEnrollment.startDate);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const questionSteps = STEP_ORDER.filter((entry) => entry !== "intro" && entry !== "confirmation");
  const currentQuestionIndex = step === "intro" || step === "confirmation" ? -1 : questionSteps.indexOf(step);
  const progressDots = questionSteps.length;

  const startDateLabel = useMemo(() => {
    if (!startDate) {
      return "your start date";
    }

    return formatProgramStartLabel(parseProgramDateKey(startDate));
  }, [startDate]);

  const patchEnrollment = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/program/enrollment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        enrollment?: SerializedEnrollment;
      };

      if (!response.ok || !data.enrollment) {
        throw new Error(data.error ?? "Unable to save your answer.");
      }

      setEnrollment(data.enrollment);
      return data.enrollment;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your answer.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const goToStep = (nextStep: WizardStep) => {
    setError("");
    setStep(nextStep);
  };

  const handleAgeSelect = async (value: ProgramAgeGroup) => {
    setAgeGroup(value);
    const saved = await patchEnrollment({ ageGroup: value });
    if (saved) {
      goToStep("position");
    }
  };

  const handlePositionSelect = async (value: string) => {
    setPosition(value);
    const saved = await patchEnrollment({ position: value });
    if (saved) {
      goToStep("focus");
    }
  };

  const handleFocusToggle = (value: ProgramFocusArea) => {
    setFocusAreas((current) => {
      if (current.includes(value)) {
        return current.filter((entry) => entry !== value);
      }

      if (current.length >= 2) {
        return current;
      }

      return [...current, value];
    });
  };

  const handleFocusContinue = async () => {
    if (focusAreas.length === 0) {
      setError("Pick at least one focus area.");
      return;
    }

    const saved = await patchEnrollment({ focusAreas });
    if (saved) {
      goToStep("equipment");
    }
  };

  const handleEquipmentToggle = (value: ProgramEquipmentOption) => {
    setEquipment((current) => {
      if (value === "nothing_special") {
        return ["nothing_special"];
      }

      const withoutNothing = current.filter((entry) => entry !== "nothing_special");
      if (withoutNothing.includes(value)) {
        return withoutNothing.filter((entry) => entry !== value);
      }

      return [...withoutNothing, value];
    });
  };

  const handleEquipmentContinue = async () => {
    if (equipment.length === 0) {
      setError("Pick at least one equipment option.");
      return;
    }

    const saved = await patchEnrollment({ equipment });
    if (saved) {
      goToStep("season");
    }
  };

  const handleSeasonSelect = async (value: ProgramSeasonMode) => {
    setSeasonMode(value);
    const saved = await patchEnrollment({ seasonMode: value });
    if (saved) {
      goToStep("known_for");
    }
  };

  const handleKnownForContinue = async () => {
    const trimmed = knownFor.trim();
    if (!trimmed) {
      setError("Please write one sentence about what you want to be known for.");
      return;
    }

    if (trimmed.length > 200) {
      setError("Keep it to 200 characters or less.");
      return;
    }

    const saved = await patchEnrollment({ knownFor: trimmed });
    if (saved) {
      goToStep("start_date");
    }
  };

  const handleStartSelect = async (choice: "today" | "tomorrow") => {
    const saved = await patchEnrollment({ startChoice: choice });
    if (saved) {
      setStartDate(saved.startDate);
      goToStep("confirmation");
    }
  };

  const handleFinish = async () => {
    const saved = await patchEnrollment({ completeOnboarding: true });
    if (saved) {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex <= 0) {
      return;
    }

    goToStep(STEP_ORDER[currentIndex - 1]);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F4F6F8] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        {step !== "intro" && step !== "confirmation" ? (
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-[#0A1628]/15 bg-white px-4 py-2 text-sm font-semibold text-[#0A1628]"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              {questionSteps.map((questionStep, index) => (
                <span
                  key={questionStep}
                  className={`h-2.5 w-2.5 rounded-full ${
                    index <= currentQuestionIndex ? "bg-[#2D6A4F]" : "bg-[#52B788]/40"
                  }`}
                />
              ))}
            </div>
            <div className="w-[72px]" />
          </div>
        ) : null}

        {checkoutSuccess ? (
          <div className="mb-4 rounded-2xl border border-[#52B788]/40 bg-[#52B788]/15 px-4 py-3 text-sm text-[#0A1628]">
            Payment successful. Let's finish setting up your 12-week program.
          </div>
        ) : null}

        <div className="rounded-3xl border border-[#0A1628]/10 bg-white p-6 shadow-sm sm:p-8">
          {step === "intro" ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-[#0A1628]">Let's build your program.</h1>
                <p className="mt-3 text-base leading-7 text-[#6B7280]">
                  Six quick questions. About two minutes. Every answer changes what your next 12 weeks
                  look like.
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToStep("age")}
                className="w-full rounded-2xl bg-[#2D6A4F] px-6 py-4 text-base font-bold text-white"
              >
                Let's go
              </button>
            </div>
          ) : null}

          {step === "age" ? (
            <QuestionScreen
              title="How old are you?"
              options={(["AGE_8_11", "AGE_12_15", "AGE_16_18"] as const).map((value) => ({
                value,
                label: PROGRAM_AGE_GROUP_LABELS[value],
              }))}
              selected={ageGroup}
              onSelect={(value) => void handleAgeSelect(value as ProgramAgeGroup)}
              saving={saving}
            />
          ) : null}

          {step === "position" ? (
            <QuestionScreen
              title="What position do you play most?"
              options={PROGRAM_POSITION_OPTIONS.map((value) => ({ value, label: value }))}
              selected={position}
              onSelect={(value) => void handlePositionSelect(value)}
              saving={saving}
            />
          ) : null}

          {step === "focus" ? (
            <MultiQuestionScreen
              title="What do you most want to improve?"
              subtitle="Pick 1 or 2."
              options={PROGRAM_FOCUS_AREAS.map((value) => ({
                value,
                label: PROGRAM_FOCUS_AREA_LABELS[value],
              }))}
              selected={focusAreas}
              onToggle={(value) => handleFocusToggle(value as ProgramFocusArea)}
              onContinue={() => void handleFocusContinue()}
              saving={saving}
              maxSelections={2}
            />
          ) : null}

          {step === "equipment" ? (
            <MultiQuestionScreen
              title="What can you use most days?"
              subtitle="Pick all that apply."
              options={PROGRAM_EQUIPMENT_OPTIONS.map((value) => ({
                value,
                label: PROGRAM_EQUIPMENT_LABELS[value],
              }))}
              selected={equipment}
              onToggle={(value) => handleEquipmentToggle(value as ProgramEquipmentOption)}
              onContinue={() => void handleEquipmentContinue()}
              saving={saving}
            />
          ) : null}

          {step === "season" ? (
            <div className="space-y-6">
              <QuestionScreen
                title="Are you in season right now?"
                options={[
                  { value: "IN_SEASON", label: "In season" },
                  { value: "OFF_SEASON", label: "Off season" },
                ]}
                selected={seasonMode}
                onSelect={(value) => void handleSeasonSelect(value as ProgramSeasonMode)}
                saving={saving}
              />
              <p className="text-sm text-[#6B7280]">You can switch this anytime.</p>
            </div>
          ) : null}

          {step === "known_for" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0A1628]">What do you want to be known for?</h2>
                <p className="mt-3 text-base leading-7 text-[#6B7280]">
                  One sentence. A coach watches you play one game. What do you want them to remember?
                </p>
              </div>
              <textarea
                value={knownFor}
                onChange={(event) => setKnownFor(event.target.value)}
                maxLength={200}
                rows={4}
                className="w-full rounded-2xl border border-[#0A1628]/15 bg-[#F4F6F8] px-4 py-3 text-base text-[#0A1628] outline-none focus:border-[#2D6A4F]"
                placeholder="I want to be known for..."
              />
              <p className="text-sm text-[#6B7280]">{knownFor.trim().length}/200 characters</p>
              <button
                type="button"
                onClick={() => void handleKnownForContinue()}
                disabled={saving}
                className="w-full rounded-2xl bg-[#2D6A4F] px-6 py-4 text-base font-bold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          ) : null}

          {step === "start_date" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0A1628]">When do you want to start?</h2>
                <p className="mt-3 text-sm text-[#6B7280]">
                  Your week starts on Day 1, no matter what day of the week it is.
                </p>
              </div>
              <div className="space-y-3">
                <OptionButton
                  label="Today"
                  selected={false}
                  onClick={() => void handleStartSelect("today")}
                  disabled={saving}
                />
                <OptionButton
                  label="Tomorrow"
                  selected={false}
                  onClick={() => void handleStartSelect("tomorrow")}
                  disabled={saving}
                />
              </div>
            </div>
          ) : null}

          {step === "confirmation" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-[#0A1628]">
                  {"You're in"}
                  {firstName ? `, ${firstName}` : ""}.
                </h2>
                <p className="mt-3 text-base leading-7 text-[#0A1628]">
                  Day 1 starts {startDateLabel}. Every morning you'll get your routine. Get the reps
                  in, leave a quick note on each one, and I'll see all of it.
                </p>
              </div>
              <div className="rounded-2xl bg-[#F4F6F8] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#2D6A4F]">
                  YOUR GOAL
                </p>
                <p className="mt-3 text-base leading-7 text-[#0A1628]">
                  {(enrollment.knownFor ?? knownFor).trim()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={saving}
                className="w-full rounded-2xl bg-[#2D6A4F] px-6 py-4 text-base font-bold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : "Go to my dashboard"}
              </button>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
        </div>

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Need help? <Link href="/dashboard" className="font-semibold text-[#2D6A4F]">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}

function QuestionScreen<T extends string>({
  title,
  options,
  selected,
  onSelect,
  saving,
}: {
  title: string;
  options: Array<{ value: T; label: string }>;
  selected: T | string | null;
  onSelect: (value: T) => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#0A1628]">{title}</h2>
      <div className="space-y-3">
        {options.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onClick={() => onSelect(option.value)}
            disabled={saving}
          />
        ))}
      </div>
    </div>
  );
}

function MultiQuestionScreen<T extends string>({
  title,
  subtitle,
  options,
  selected,
  onToggle,
  onContinue,
  saving,
  maxSelections,
}: {
  title: string;
  subtitle: string;
  options: Array<{ value: T; label: string }>;
  selected: T[];
  onToggle: (value: T) => void;
  onContinue: () => void;
  saving: boolean;
  maxSelections?: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0A1628]">{title}</h2>
        <p className="mt-2 text-sm text-[#6B7280]">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const isBlocked =
            Boolean(maxSelections) &&
            !isSelected &&
            selected.length >= (maxSelections ?? Number.MAX_SAFE_INTEGER);

          return (
            <OptionButton
              key={option.value}
              label={option.label}
              selected={isSelected}
              onClick={() => onToggle(option.value)}
              disabled={saving || isBlocked}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="w-full rounded-2xl bg-[#2D6A4F] px-6 py-4 text-base font-bold text-white disabled:opacity-70"
      >
        {saving ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl border px-5 py-4 text-left text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
          : "border-[#0A1628]/15 bg-[#F4F6F8] text-[#0A1628] hover:border-[#52B788]"
      }`}
    >
      {label}
    </button>
  );
}
