"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LEGAL_PAGE_PATHS } from "@/lib/legal-shared";
import {
  createEmptyWaiverSignFormValues,
  createWaiverPlayerEntry,
  getWaiverSignerLabel,
  isAdultSelfSignMode,
  isValidPlayerAge,
  parsePlayerAge,
  WAIVER_ADULT_AGE,
  WAIVER_MAX_PLAYERS,
  WAIVER_SIGN_INTRO,
  WAIVER_SIGN_KEY_TEXT,
  WAIVER_SIGNUP_TYPE_OPTIONS,
  type WaiverPlayerEntry,
  type WaiverSignFormValues,
} from "@/lib/waiver-sign-shared";

type WaiverSignFormProps = {
  initialTeamName?: string;
  teamLocked?: boolean;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0A1628]/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#52B788] focus:outline-none";
const labelClass = "block text-sm font-medium text-zinc-200";

export default function WaiverSignForm({ initialTeamName = "", teamLocked = false }: WaiverSignFormProps) {
  const [values, setValues] = useState<WaiverSignFormValues>(
    createEmptyWaiverSignFormValues(initialTeamName),
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedPlayerNames, setCompletedPlayerNames] = useState<string[]>([]);

  const adultSelfSign = isAdultSelfSignMode(values.players);
  const primaryPlayerAge = parsePlayerAge(values.players[0]?.playerAge ?? "");
  const signerLabel = useMemo(() => {
    if (isValidPlayerAge(primaryPlayerAge)) {
      return getWaiverSignerLabel(primaryPlayerAge);
    }

    return "Parent or guardian full name";
  }, [primaryPlayerAge]);

  const updateValues = (patch: Partial<WaiverSignFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  const updatePlayer = (playerId: string, patch: Partial<WaiverPlayerEntry>) => {
    setValues((current) => {
      const nextPlayers = current.players.map((player) =>
        player.id === playerId ? { ...player, ...patch } : player,
      );

      const updatedPlayer = nextPlayers.find((player) => player.id === playerId);
      if (updatedPlayer && patch.playerAge !== undefined) {
        const playerAge = parsePlayerAge(updatedPlayer.playerAge);
        if (isValidPlayerAge(playerAge) && playerAge >= WAIVER_ADULT_AGE) {
          return { ...current, players: [updatedPlayer] };
        }
      }

      return { ...current, players: nextPlayers };
    });
  };

  const addPlayer = () => {
    setValues((current) => {
      if (current.players.length >= WAIVER_MAX_PLAYERS || isAdultSelfSignMode(current.players)) {
        return current;
      }

      return {
        ...current,
        players: [...current.players, createWaiverPlayerEntry()],
      };
    });
  };

  const removePlayer = (playerId: string) => {
    setValues((current) => {
      if (current.players.length <= 1) {
        return current;
      }

      return {
        ...current,
        players: current.players.filter((player) => player.id !== playerId),
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/waiver/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        ...values,
        teamLocked,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      success?: boolean;
      playerNames?: string[];
    };

    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to save waiver right now.");
      return;
    }

    setCompletedPlayerNames(data.playerNames ?? []);
  };

  if (completedPlayerNames.length > 0) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">You&apos;re all set. See you at training.</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Signed for: {completedPlayerNames.join(", ")}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          A confirmation email has been sent with links to the signed documents.
        </p>
        <p className="mt-6 text-sm text-zinc-300">
          Want a daily plan between lessons?{" "}
          <Link href="/program" className="font-semibold text-[#52B788] underline-offset-2 hover:underline">
            Check out the 12-Week Program
          </Link>
          .
        </p>
      </div>
    );
  }

  const mediaConsentLabel =
    values.players.length > 1
      ? "OK for Coach Broc to share videos of these players on LCB Training social media and website."
      : "OK for Coach Broc to share videos of this player on LCB Training social media and website.";

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Sign the waiver</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{WAIVER_SIGN_INTRO}</p>

      <p className="mt-4 text-sm text-zinc-300">
        Read the full{" "}
        <Link href={LEGAL_PAGE_PATHS.terms} target="_blank" className="text-[#98b144] underline">
          Terms of Service
        </Link>
        ,{" "}
        <Link href={LEGAL_PAGE_PATHS.privacy} target="_blank" className="text-[#98b144] underline">
          Privacy Policy
        </Link>
        , and{" "}
        <Link href={LEGAL_PAGE_PATHS.waiver} target="_blank" className="text-[#98b144] underline">
          Waiver
        </Link>
        .
      </p>

      <div className="mt-5 max-h-56 overflow-y-auto rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 p-4 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
        {WAIVER_SIGN_KEY_TEXT}
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-8">
        <section className="space-y-4 rounded-2xl border border-[#2b3650] bg-[#0b1324]/50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">Players</h2>
            {!adultSelfSign && values.players.length < WAIVER_MAX_PLAYERS ? (
              <button
                type="button"
                onClick={addPlayer}
                className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788]"
              >
                Add another player
              </button>
            ) : null}
          </div>

          <div className="space-y-5">
            {values.players.map((player, index) => (
              <div key={player.id} className="rounded-xl border border-[#2b3650] bg-[#0A1628]/40 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-zinc-200">Player {index + 1}</h3>
                  {values.players.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removePlayer(player.id)}
                      className="text-sm text-zinc-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    First name
                    <input
                      type="text"
                      required
                      value={player.playerFirstName}
                      onChange={(event) =>
                        updatePlayer(player.id, { playerFirstName: event.target.value })
                      }
                      className={inputClass}
                      autoComplete={index === 0 ? "given-name" : "off"}
                    />
                  </label>
                  <label className={labelClass}>
                    Last name
                    <input
                      type="text"
                      required
                      value={player.playerLastName}
                      onChange={(event) =>
                        updatePlayer(player.id, { playerLastName: event.target.value })
                      }
                      className={inputClass}
                      autoComplete={index === 0 ? "family-name" : "off"}
                    />
                  </label>
                </div>

                <label className={`${labelClass} mt-4`}>
                  Age
                  <input
                    type="number"
                    required
                    min={5}
                    max={19}
                    inputMode="numeric"
                    value={player.playerAge}
                    onChange={(event) => updatePlayer(player.id, { playerAge: event.target.value })}
                    className={inputClass}
                  />
                </label>

                <label className={`${labelClass} mt-4`}>
                  Medical conditions, injuries, or allergies I should know about (optional)
                  <textarea
                    rows={3}
                    value={player.medicalNotes}
                    onChange={(event) => updatePlayer(player.id, { medicalNotes: event.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-[#2b3650] bg-[#0b1324]/50 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-zinc-100">Parent or guardian</h2>

          <label className={labelClass}>
            Team name {teamLocked ? "" : "(optional)"}
            <input
              type="text"
              value={values.teamName}
              onChange={(event) => updateValues({ teamName: event.target.value })}
              readOnly={teamLocked}
              className={`${inputClass} ${teamLocked ? "opacity-80" : ""}`}
            />
          </label>

          <fieldset>
            <legend className={labelClass}>What are they signing up for?</legend>
            <div className="mt-2 space-y-2">
              {WAIVER_SIGNUP_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="radio"
                    name="signupType"
                    value={option.value}
                    checked={values.signupType === option.value}
                    onChange={() => updateValues({ signupType: option.value })}
                    className="h-4 w-4 accent-[#22c55e]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className={labelClass}>
            {signerLabel}
            <input
              type="text"
              required
              value={values.signerFullName}
              onChange={(event) => updateValues({ signerFullName: event.target.value })}
              className={inputClass}
              autoComplete="name"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              {adultSelfSign ? "Your email" : "Parent or guardian email"}
              <input
                type="email"
                required
                value={values.signerEmail}
                onChange={(event) => updateValues({ signerEmail: event.target.value })}
                className={inputClass}
                autoComplete="email"
              />
            </label>
            <label className={labelClass}>
              Phone (optional)
              <input
                type="tel"
                value={values.signerPhone}
                onChange={(event) => updateValues({ signerPhone: event.target.value })}
                className={inputClass}
                autoComplete="tel"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Emergency contact name
              <input
                type="text"
                required
                value={values.emergencyContactName}
                onChange={(event) => updateValues({ emergencyContactName: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Emergency contact phone
              <input
                type="tel"
                required
                value={values.emergencyContactPhone}
                onChange={(event) => updateValues({ emergencyContactPhone: event.target.value })}
                className={inputClass}
                autoComplete="tel"
              />
            </label>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              required
              checked={values.termsAccepted}
              onChange={(event) => updateValues({ termsAccepted: event.target.checked })}
              className="mt-1 h-4 w-4 shrink-0 accent-[#22c55e]"
            />
            <span className="text-sm text-zinc-300">
              I am the player&apos;s parent or legal guardian (or the player and 18+), and I agree to the Terms of
              Service, Privacy Policy, and Waiver.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={values.mediaConsent}
              onChange={(event) => updateValues({ mediaConsent: event.target.checked })}
              className="mt-1 h-4 w-4 shrink-0 accent-[#22c55e]"
            />
            <span className="text-sm text-zinc-300">{mediaConsentLabel}</span>
          </label>

          <label className={labelClass}>
            Type your full name to sign
            <input
              type="text"
              required
              value={values.typedSignature}
              onChange={(event) => updateValues({ typedSignature: event.target.value })}
              className={inputClass}
              autoComplete="off"
            />
          </label>
        </section>

        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(event) => updateValues({ website: event.target.value })}
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Saving..." : values.players.length > 1 ? "Sign waivers" : "Sign waiver"}
        </button>
      </form>
    </div>
  );
}
