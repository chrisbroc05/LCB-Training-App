"use client";

import { useEffect, useState } from "react";
import ProfileCard from "@/app/profile/ProfileCard";
import {
  profileBodyTextClass,
  profileErrorMessageClass,
  profileLabelClass,
  profileMutedTextClass,
  profilePrimaryButtonClass,
  profileSecondaryButtonClass,
  profileSuccessMessageClass,
  profileValueClass,
} from "@/app/profile/profile-styles";
import {
  settingsInputClass,
  settingsLabelClass,
  settingsTextareaClass,
} from "@/app/settings/settings-styles";
import {
  getGraduationYearOptions,
  PLAYER_LEVELS,
  PLAYER_POSITIONS,
} from "@/lib/player-profile";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  position: string;
  age: string;
  graduationYear: string;
  currentTeam: string;
  level: string;
  playerBio: string;
};

const graduationYearOptions = getGraduationYearOptions();

function hasFilledProfile(form: ProfileFormState) {
  return Boolean(
    form.position ||
      form.age ||
      form.graduationYear ||
      form.currentTeam ||
      form.level ||
      form.playerBio,
  );
}

export default function PlayerProfileCard() {
  const [form, setForm] = useState<ProfileFormState>({
    firstName: "",
    lastName: "",
    position: "",
    age: "",
    graduationYear: "",
    currentTeam: "",
    level: "",
    playerBio: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      const response = await fetch("/api/settings/profile");
      setIsLoading(false);

      if (!response.ok) {
        setErrorMessage("Unable to load your player profile right now.");
        return;
      }

      const data = (await response.json()) as {
        profile?: {
          firstName?: string;
          lastName?: string;
          position?: string;
          age?: number | null;
          graduationYear?: number | null;
          currentTeam?: string;
          level?: string;
          playerBio?: string;
        };
      };

      const profile = data.profile;
      setForm({
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        position: profile?.position ?? "",
        age: profile?.age ? String(profile.age) : "",
        graduationYear: profile?.graduationYear ? String(profile.graduationYear) : "",
        currentTeam: profile?.currentTeam ?? "",
        level: profile?.level ?? "",
        playerBio: profile?.playerBio ?? "",
      });
    };

    void loadProfile();
  }, []);

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/settings/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        position: form.position,
        age: form.age ? Number.parseInt(form.age, 10) : null,
        graduationYear: form.graduationYear ? Number.parseInt(form.graduationYear, 10) : null,
        currentTeam: form.currentTeam,
        level: form.level,
        playerBio: form.playerBio,
      }),
    });

    setIsSaving(false);

    const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to save your profile right now.");
      return;
    }

    setSuccessMessage(data.message ?? "Profile saved");
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <ProfileCard title="Player Profile">
        <p className={profileMutedTextClass}>Loading profile...</p>
      </ProfileCard>
    );
  }

  const profileComplete = hasFilledProfile(form);

  if (!isEditing) {
    return (
      <ProfileCard title="Player Profile">
        {!profileComplete ? (
          <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
            <p className={profileBodyTextClass}>
              Complete your player profile so Coach Broc knows more about you.
            </p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`mt-4 ${profilePrimaryButtonClass}`}
            >
              Fill Out Profile
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              {form.position ? (
                <div>
                  <p className={profileLabelClass}>Position</p>
                  <p className={profileValueClass}>{form.position}</p>
                </div>
              ) : null}
              {form.age ? (
                <div>
                  <p className={profileLabelClass}>Age</p>
                  <p className={profileValueClass}>{form.age}</p>
                </div>
              ) : null}
              {form.graduationYear ? (
                <div>
                  <p className={profileLabelClass}>Graduation year</p>
                  <p className={profileValueClass}>{form.graduationYear}</p>
                </div>
              ) : null}
              {form.currentTeam ? (
                <div>
                  <p className={profileLabelClass}>Current team</p>
                  <p className={profileValueClass}>{form.currentTeam}</p>
                </div>
              ) : null}
              {form.level ? (
                <div>
                  <p className={profileLabelClass}>Level</p>
                  <p className={profileValueClass}>{form.level}</p>
                </div>
              ) : null}
              {form.playerBio ? (
                <div className="sm:col-span-2">
                  <p className={profileLabelClass}>Player bio</p>
                  <p className={`${profileValueClass} whitespace-pre-wrap`}>{form.playerBio}</p>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`mt-5 ${profileSecondaryButtonClass}`}
            >
              Edit Profile
            </button>
          </>
        )}
      </ProfileCard>
    );
  }

  return (
    <ProfileCard
      title="Player Profile"
      description="Share your player details so Coach Broc has context on every submission."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={settingsLabelClass}>First name</span>
            <input
              type="text"
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              className={settingsInputClass}
            />
          </label>
          <label className="block">
            <span className={settingsLabelClass}>Last name</span>
            <input
              type="text"
              value={form.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              className={settingsInputClass}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={settingsLabelClass}>Position</span>
            <select
              value={form.position}
              onChange={(event) => updateField("position", event.target.value)}
              className={settingsInputClass}
            >
              <option value="">Select a position</option>
              {PLAYER_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabelClass}>Age</span>
            <input
              type="number"
              min={1}
              max={99}
              value={form.age}
              onChange={(event) => updateField("age", event.target.value)}
              className={settingsInputClass}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={settingsLabelClass}>Graduation year</span>
            <select
              value={form.graduationYear}
              onChange={(event) => updateField("graduationYear", event.target.value)}
              className={settingsInputClass}
            >
              <option value="">Select a year</option>
              {graduationYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabelClass}>Current level</span>
            <select
              value={form.level}
              onChange={(event) => updateField("level", event.target.value)}
              className={settingsInputClass}
            >
              <option value="">Select a level</option>
              {PLAYER_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className={settingsLabelClass}>Current team or school</span>
          <input
            type="text"
            value={form.currentTeam}
            onChange={(event) => updateField("currentTeam", event.target.value)}
            className={settingsInputClass}
          />
        </label>

        <label className="block">
          <span className={settingsLabelClass}>
            Anything else you want Coach Broc to know about you (optional)
          </span>
          <textarea
            value={form.playerBio}
            onChange={(event) => updateField("playerBio", event.target.value)}
            rows={4}
            className={settingsTextareaClass}
          />
        </label>

        {errorMessage ? <p className={profileErrorMessageClass}>{errorMessage}</p> : null}
        {successMessage ? <p className={profileSuccessMessageClass}>{successMessage}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={isSaving} className={profilePrimaryButtonClass}>
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={profileSecondaryButtonClass}
          >
            Cancel
          </button>
        </div>
      </form>
    </ProfileCard>
  );
}
