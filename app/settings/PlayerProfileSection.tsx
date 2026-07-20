"use client";

import { useEffect, useState } from "react";
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

export default function PlayerProfileSection() {
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
      headers: {
        "Content-Type": "application/json",
      },
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
  };

  if (isLoading) {
    return (
      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Player Profile</h2>
        <p className="mt-4 text-sm text-zinc-400">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Player Profile</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Share your player details so Coach Broc has context on every submission.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-zinc-300">First name</span>
            <input
              type="text"
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-300">Last name</span>
            <input
              type="text"
              value={form.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-zinc-300">Position</span>
            <select
              value={form.position}
              onChange={(event) => updateField("position", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
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
            <span className="text-sm text-zinc-300">Age</span>
            <input
              type="number"
              min={1}
              max={99}
              value={form.age}
              onChange={(event) => updateField("age", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-zinc-300">Graduation year</span>
            <select
              value={form.graduationYear}
              onChange={(event) => updateField("graduationYear", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
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
            <span className="text-sm text-zinc-300">Current level</span>
            <select
              value={form.level}
              onChange={(event) => updateField("level", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
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
          <span className="text-sm text-zinc-300">Current team or school</span>
          <input
            type="text"
            value={form.currentTeam}
            onChange={(event) => updateField("currentTeam", event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-300">
            Anything else you want Coach Broc to know about you (optional)
          </span>
          <textarea
            value={form.playerBio}
            onChange={(event) => updateField("playerBio", event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
          />
        </label>

        {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
        {successMessage ? (
          <p className="text-sm text-[#9df3bd]">{successMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </section>
  );
}
