"use client";

import { useEffect, useState } from "react";
import CoachFormattedText from "@/components/CoachFormattedText";
import ProfileCard from "@/app/profile/ProfileCard";
import {
  profileBodyTextClass,
  profileErrorMessageClass,
  profileMutedTextClass,
  profilePrimaryButtonClass,
  profileSuccessMessageClass,
} from "@/app/profile/profile-styles";
import {
  settingsInputClass,
  settingsLabelClass,
  settingsTextareaClass,
} from "@/app/settings/settings-styles";
import {
  getRecruitingGraduationYearOptions,
  RECRUITING_GPA_RANGES,
  RECRUITING_LEVELS,
  RECRUITING_LOCATIONS,
  RECRUITING_POSITIONS,
  RECRUITING_SCHOLARSHIP_IMPORTANCE,
  RECRUITING_SCHOOL_SIZES,
  serializeRecruitingProfile,
  type RecruitingProfileView,
} from "@/lib/recruiting-shared";

const emptyProfile = serializeRecruitingProfile(null);
const gradYearOptions = getRecruitingGraduationYearOptions();

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export default function RecruitingHelpCard() {
  const [available, setAvailable] = useState(false);
  const [profile, setProfile] = useState<RecruitingProfileView>(emptyProfile);
  const [draft, setDraft] = useState<RecruitingProfileView>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await fetch("/api/recruiting");
      setLoading(false);
      if (response.status === 403) {
        setAvailable(false);
        return;
      }
      if (!response.ok) {
        setErrorMessage("Unable to load recruiting help right now.");
        return;
      }
      const data = (await response.json()) as { profile?: RecruitingProfileView };
      const next = data.profile ?? emptyProfile;
      setAvailable(true);
      setProfile(next);
      setDraft(next);
    })();
  }, []);

  if (loading) {
    return (
      <ProfileCard title="Recruiting help">
        <p className={profileMutedTextClass}>Loading...</p>
      </ProfileCard>
    );
  }

  if (!available) {
    return null;
  }

  const save = async (payload: { enabled?: boolean; answers?: boolean }) => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    const body: Record<string, unknown> = {};
    if (typeof payload.enabled === "boolean") {
      body.enabled = payload.enabled;
    }
    if (payload.answers) {
      body.answers = {
        gradYear: draft.gradYear,
        primaryPosition: draft.primaryPosition,
        secondaryPosition: draft.secondaryPosition,
        levelsOpenTo: draft.levelsOpenTo,
        locationPreference: draft.locationPreference,
        schoolSize: draft.schoolSize,
        majorOrStudy: draft.majorOrStudy,
        gpaRange: draft.gpaRange,
        scholarshipImportance: draft.scholarshipImportance,
        videoUrl: draft.videoUrl,
        notesForCoach: draft.notesForCoach,
      };
    }

    const response = await fetch("/api/recruiting", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as {
      profile?: RecruitingProfileView;
      error?: string;
    };
    setSaving(false);
    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to save recruiting help.");
      return;
    }
    const next = data.profile ?? emptyProfile;
    setProfile(next);
    setDraft(next);
    setSuccessMessage("Saved.");
  };

  const toggleLevel = (level: string) => {
    setDraft((current) => ({
      ...current,
      levelsOpenTo: current.levelsOpenTo.includes(level)
        ? current.levelsOpenTo.filter((item) => item !== level)
        : [...current.levelsOpenTo, level],
    }));
  };

  const lastUpdated = formatUpdatedAt(profile.answersUpdatedAt);

  return (
    <ProfileCard title="Recruiting help">
      <p className={profileBodyTextClass}>
        Turn this on if you want Coach Broc&apos;s help with college recruiting. Your answers stay
        on your profile so you can update them anytime.
      </p>

      <label className="mt-4 flex items-center gap-3 text-sm text-zinc-200">
        <input
          type="checkbox"
          checked={draft.enabled}
          disabled={saving}
          onChange={(event) => {
            const enabled = event.target.checked;
            setDraft((current) => ({ ...current, enabled }));
            void save({ enabled });
          }}
          className="h-4 w-4 rounded border-[#2b3650]"
        />
        Recruiting help
      </label>

      {draft.enabled ? (
        <div className="mt-5 space-y-4">
          {lastUpdated ? (
            <p className={profileMutedTextClass}>Last updated {lastUpdated}</p>
          ) : null}

          <label className={settingsLabelClass}>
            Grad year
            <select
              className={settingsInputClass}
              value={draft.gradYear ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  gradYear: event.target.value ? Number(event.target.value) : null,
                }))
              }
            >
              <option value="">Select</option>
              {gradYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className={settingsLabelClass}>
            Primary position
            <select
              className={settingsInputClass}
              value={draft.primaryPosition ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  primaryPosition: event.target.value || null,
                }))
              }
            >
              <option value="">Select</option>
              {RECRUITING_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>

          <label className={settingsLabelClass}>
            Secondary position
            <select
              className={settingsInputClass}
              value={draft.secondaryPosition ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  secondaryPosition: event.target.value || null,
                }))
              }
            >
              <option value="">Select</option>
              {RECRUITING_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-medium text-zinc-300">Levels open to</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {RECRUITING_LEVELS.map((level) => {
                const selected = draft.levelsOpenTo.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      selected
                        ? "border-[#52B788] bg-[#52B788]/15 text-[#9df3bd]"
                        : "border-[#2b3650] text-zinc-400"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className={settingsLabelClass}>
            Location
            <select
              className={settingsInputClass}
              value={draft.locationPreference ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  locationPreference: event.target.value || null,
                }))
              }
            >
              <option value="">Select</option>
              {RECRUITING_LOCATIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className={settingsLabelClass}>
            School size
            <select
              className={settingsInputClass}
              value={draft.schoolSize ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  schoolSize: event.target.value || null,
                }))
              }
            >
              <option value="">Select</option>
              {RECRUITING_SCHOOL_SIZES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className={settingsLabelClass}>
            Possible major or area of study (optional)
            <input
              className={settingsInputClass}
              value={draft.majorOrStudy ?? ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, majorOrStudy: event.target.value }))
              }
            />
          </label>

          <label className={settingsLabelClass}>
            GPA range (optional)
            <select
              className={settingsInputClass}
              value={draft.gpaRange ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  gpaRange: event.target.value || null,
                }))
              }
            >
              <option value="">Select</option>
              {RECRUITING_GPA_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </label>

          <label className={settingsLabelClass}>
            Scholarship money importance
            <select
              className={settingsInputClass}
              value={draft.scholarshipImportance ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  scholarshipImportance: event.target.value || null,
                }))
              }
            >
              <option value="">Select</option>
              {RECRUITING_SCHOLARSHIP_IMPORTANCE.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className={settingsLabelClass}>
            Video link (optional)
            <input
              className={settingsInputClass}
              value={draft.videoUrl ?? ""}
              placeholder="https://"
              onChange={(event) =>
                setDraft((current) => ({ ...current, videoUrl: event.target.value }))
              }
            />
          </label>

          <label className={settingsLabelClass}>
            Anything else Coach Broc should know (optional)
            <textarea
              className={settingsTextareaClass}
              rows={3}
              value={draft.notesForCoach ?? ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notesForCoach: event.target.value }))
              }
            />
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={() => void save({ answers: true })}
            className={profilePrimaryButtonClass}
          >
            {saving ? "Saving..." : "Save answers"}
          </button>
        </div>
      ) : (
        <p className={`mt-3 ${profileMutedTextClass}`}>
          Turn on Recruiting help to answer a short form for Coach Broc.
        </p>
      )}

      {profile.coachSchoolList?.trim() ? (
        <div className="mt-6 rounded-xl border border-[#52B788]/30 bg-[#52B788]/5 p-4">
          <p className="text-sm font-semibold text-zinc-100">Coach Broc&apos;s school list</p>
          {formatUpdatedAt(profile.schoolListUpdatedAt) ? (
            <p className={`mt-1 ${profileMutedTextClass}`}>
              Updated {formatUpdatedAt(profile.schoolListUpdatedAt)}
            </p>
          ) : null}
          <CoachFormattedText
            text={profile.coachSchoolList}
            className="mt-3 text-sm text-zinc-300"
          />
        </div>
      ) : null}

      {errorMessage ? <p className={`mt-3 ${profileErrorMessageClass}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`mt-3 ${profileSuccessMessageClass}`}>{successMessage}</p>
      ) : null}
    </ProfileCard>
  );
}
