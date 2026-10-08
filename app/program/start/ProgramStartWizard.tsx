"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  PROGRAM_AGE_GROUP_LABELS,
  PROGRAM_EQUIPMENT_LABELS,
  PROGRAM_EQUIPMENT_OPTIONS,
  PROGRAM_FOCUS_AREA_LABELS,
  PROGRAM_FOCUS_AREAS,
  PROGRAM_POSITION_OPTIONS,
  type ProgramAgeGroup,
  type ProgramEquipmentOption,
  type ProgramFocusArea,
  type ProgramSeasonMode,
} from "@/lib/program-enrollment-shared";
import LegalAgreementFields, {
  buildLegalAcceptancePayload,
  createEmptyLegalAgreementValues,
  validateLegalAgreementValues,
} from "@/components/LegalAgreementFields";
import { isUnder13ProgramAge } from "@/lib/legal-shared";
import { BRAND_SECONDARY_TAGLINE } from "@/lib/brand-copy";
import {
  addChicagoCalendarDays,
  formatProgramStartLabel,
  getChicagoTodayDateKey,
  parseProgramDateKey,
} from "@/lib/program-schedule";
import {
  type InPersonTrainingInfo,
  validateInPersonTrainingInput,
} from "@/lib/in-person-training-shared";

type SerializedEnrollment = {
  ageGroup: ProgramAgeGroup | null;
  position: string | null;
  focusAreas: string[];
  equipment: string[];
  seasonMode: ProgramSeasonMode | null;
  knownFor: string | null;
  startDate: string | null;
  parentName: string | null;
  parentEmail: string | null;
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
  | "parent"
  | "parent_legal"
  | "in_person"
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
  "parent",
  "in_person",
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

  return "parent";
}

function needsParentLegalStep(params: {
  ageGroup: ProgramAgeGroup | null;
  acceptedAsParent: boolean;
  playerAge: number | null;
}) {
  if (params.acceptedAsParent || isUnder13ProgramAge(params.playerAge)) {
    return false;
  }

  return params.ageGroup === "AGE_8_11";
}

type ProgramStartWizardProps = {
  firstName: string;
  initialEnrollment: SerializedEnrollment;
  checkoutSuccess: boolean;
  initialAcceptedAsParent: boolean;
  initialPlayerAge: number | null;
  initialInPersonTraining: InPersonTrainingInfo;
};

export default function ProgramStartWizard({
  firstName,
  initialEnrollment,
  checkoutSuccess,
  initialAcceptedAsParent,
  initialPlayerAge,
  initialInPersonTraining,
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
  const [selectedStartDateKey, setSelectedStartDateKey] = useState(
    () => initialEnrollment.startDate ?? getChicagoTodayDateKey(),
  );
  const [parentName, setParentName] = useState(initialEnrollment.parentName ?? "");
  const [parentEmail, setParentEmail] = useState(initialEnrollment.parentEmail ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [acceptedAsParent, setAcceptedAsParent] = useState(initialAcceptedAsParent);
  const [parentLegalAgreement, setParentLegalAgreement] = useState(() => {
    const values = createEmptyLegalAgreementValues();
    values.agreementRole = "parent";
    return values;
  });
  const [trainsInPerson, setTrainsInPerson] = useState(initialInPersonTraining.trainsInPerson);
  const [emergencyContactName, setEmergencyContactName] = useState(
    initialInPersonTraining.emergencyContactName ?? "",
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    initialInPersonTraining.emergencyContactPhone ?? "",
  );
  const [medicalNotes, setMedicalNotes] = useState(initialInPersonTraining.medicalNotes ?? "");

  const questionSteps = STEP_ORDER.filter((entry) => entry !== "intro" && entry !== "confirmation");
  const currentQuestionIndex = step === "intro" || step === "confirmation" ? -1 : questionSteps.indexOf(step);
  const progressDots = questionSteps.length;

  const startDateLabel = useMemo(() => {
    if (!startDate) {
      return "your start date";
    }

    return formatProgramStartLabel(parseProgramDateKey(startDate));
  }, [startDate]);

  const startDateMinKey = useMemo(() => getChicagoTodayDateKey(), []);
  const startDateMaxKey = useMemo(
    () => addChicagoCalendarDays(startDateMinKey, 14),
    [startDateMinKey],
  );

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

  const handleStartContinue = async () => {
    const saved = await patchEnrollment({ startDateKey: selectedStartDateKey });
    if (saved) {
      setStartDate(saved.startDate);
      goToStep("parent");
    }
  };

  const handleParentContinue = async () => {
    const trimmedEmail = parentEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email or leave it blank.");
      return;
    }

    const saved = await patchEnrollment({
      parentName: parentName.trim() || null,
      parentEmail: trimmedEmail || null,
    });

    if (saved) {
      if (needsParentLegalStep({ ageGroup, acceptedAsParent, playerAge: initialPlayerAge })) {
        goToStep("parent_legal");
      } else {
        goToStep("in_person");
      }
    }
  };

  const handleParentSkip = () => {
    setError("");
    if (needsParentLegalStep({ ageGroup, acceptedAsParent, playerAge: initialPlayerAge })) {
      goToStep("parent_legal");
      return;
    }

    goToStep("in_person");
  };

  const handleParentLegalContinue = async () => {
    const validationError = validateLegalAgreementValues(parentLegalAgreement);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = buildLegalAcceptancePayload(parentLegalAgreement);
    if (!payload || !payload.acceptedAsParent) {
      setError("A parent or guardian must agree for players under 13.");
      return;
    }

    setSaving(true);
    setError("");

    const response = await fetch("/api/legal/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to save parent agreement.");
      setSaving(false);
      return;
    }

    setAcceptedAsParent(true);
    setSaving(false);
    goToStep("in_person");
  };

  const saveInPersonTraining = async (nextTrainsInPerson: boolean) => {
    const input = {
      trainsInPerson: nextTrainsInPerson,
      emergencyContactName,
      emergencyContactPhone,
      medicalNotes,
    };

    const validationError = validateInPersonTrainingInput(input);
    if (validationError) {
      setError(validationError);
      return false;
    }

    setSaving(true);
    setError("");

    const response = await fetch("/api/settings/in-person-training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to save in-person training info.");
      return false;
    }

    return true;
  };

  const handleInPersonNo = async () => {
    setTrainsInPerson(false);
    const saved = await saveInPersonTraining(false);
    if (saved) {
      goToStep("confirmation");
    }
  };

  const handleInPersonContinue = async () => {
    setTrainsInPerson(true);
    const saved = await saveInPersonTraining(true);
    if (saved) {
      goToStep("confirmation");
    }
  };

  const handleFinish = async () => {
    if (needsParentLegalStep({ ageGroup, acceptedAsParent, playerAge: initialPlayerAge })) {
      goToStep("parent_legal");
      return;
    }

    const saved = await patchEnrollment({ completeOnboarding: true });
    if (saved) {
      router.push("/dashboard/today");
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
                  You get that day&apos;s tasks right away. You can start today or pick a date up to
                  two weeks out.
                </p>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#0A1628]">Start date</span>
                <input
                  type="date"
                  value={selectedStartDateKey}
                  min={startDateMinKey}
                  max={startDateMaxKey}
                  onChange={(event) => setSelectedStartDateKey(event.target.value)}
                  className="w-full rounded-2xl border border-[#0A1628]/15 px-4 py-3 text-sm text-[#0A1628]"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleStartContinue()}
                disabled={saving}
                className="w-full rounded-2xl bg-[#2D6A4F] px-6 py-4 text-base font-bold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          ) : null}

          {step === "parent" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0A1628]">Want someone else kept in the loop?</h2>
                <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                  Add a parent email or your own if a parent signed you up. They get weekly recaps
                  and a heads up if things slip.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#0A1628]">Name (optional)</span>
                <input
                  type="text"
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  className="w-full rounded-2xl border border-[#0A1628]/15 px-4 py-3 text-sm text-[#0A1628]"
                  placeholder="Optional"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#0A1628]">Second email (optional)</span>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(event) => setParentEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[#0A1628]/15 px-4 py-3 text-sm text-[#0A1628]"
                  placeholder="Optional"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleParentContinue()}
                  disabled={saving}
                  className="rounded-2xl bg-[#2D6A4F] px-6 py-3 text-sm font-bold text-white disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
                <button
                  type="button"
                  onClick={handleParentSkip}
                  disabled={saving}
                  className="rounded-2xl border border-[#0A1628]/15 px-6 py-3 text-sm font-semibold text-[#0A1628]"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : null}

          {step === "in_person" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0A1628]">
                  Will you also train with Coach Broc in person (lessons or team)?
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                  If yes, add an emergency contact so we are ready at lessons and team sessions.
                </p>
              </div>

              <div className="space-y-3">
                <OptionButton
                  label="Yes"
                  selected={trainsInPerson}
                  onClick={() => setTrainsInPerson(true)}
                  disabled={saving}
                />
                <OptionButton
                  label="No"
                  selected={!trainsInPerson}
                  onClick={() => setTrainsInPerson(false)}
                  disabled={saving}
                />
              </div>

              {trainsInPerson ? (
                <>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[#0A1628]">
                      Emergency contact name
                    </span>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(event) => setEmergencyContactName(event.target.value)}
                      className="w-full rounded-2xl border border-[#0A1628]/15 px-4 py-3 text-sm text-[#0A1628]"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[#0A1628]">
                      Emergency contact phone
                    </span>
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(event) => setEmergencyContactPhone(event.target.value)}
                      className="w-full rounded-2xl border border-[#0A1628]/15 px-4 py-3 text-sm text-[#0A1628]"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[#0A1628]">
                      Medical conditions, injuries, or allergies (optional)
                    </span>
                    <textarea
                      rows={4}
                      value={medicalNotes}
                      onChange={(event) => setMedicalNotes(event.target.value)}
                      className="w-full rounded-2xl border border-[#0A1628]/15 px-4 py-3 text-sm text-[#0A1628]"
                    />
                  </label>
                </>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {trainsInPerson ? (
                  <button
                    type="button"
                    onClick={() => void handleInPersonContinue()}
                    disabled={saving}
                    className="rounded-2xl bg-[#2D6A4F] px-6 py-3 text-sm font-bold text-white disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Continue"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleInPersonNo()}
                    disabled={saving}
                    className="rounded-2xl bg-[#2D6A4F] px-6 py-3 text-sm font-bold text-white disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Continue"}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {step === "parent_legal" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0A1628]">Parent or guardian agreement</h2>
                <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                  Players under 13 need a parent or guardian to agree.
                </p>
              </div>

              <LegalAgreementFields
                values={parentLegalAgreement}
                onChange={setParentLegalAgreement}
                compact
              />

              <button
                type="button"
                onClick={() => void handleParentLegalContinue()}
                disabled={saving}
                className="w-full rounded-2xl bg-[#2D6A4F] px-6 py-4 text-base font-bold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
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
                  You start {startDateLabel}. Every morning you&apos;ll get your routine. Get the
                  reps in, leave a quick note on each one, and I&apos;ll see all of it.
                </p>
              </div>
              <div className="rounded-2xl bg-[#F4F6F8] p-5">
                <p className="text-xs font-bold tracking-wide text-[#2D6A4F]">
                  {BRAND_SECONDARY_TAGLINE}
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
