"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LEGAL_PAGE_PATHS } from "@/lib/legal-shared";
import {
  createEmptyWaiverSignFormValues,
  getWaiverSignerLabel,
  WAIVER_ADULT_AGE,
  WAIVER_SIGN_INTRO,
  WAIVER_SIGN_KEY_TEXT,
  WAIVER_SIGNUP_TYPE_OPTIONS,
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
  const [completed, setCompleted] = useState(false);

  const playerAge = Number.parseInt(values.playerAge, 10);
  const isAdultPlayer = Number.isInteger(playerAge) && playerAge >= WAIVER_ADULT_AGE;
  const signerLabel = useMemo(
    () => (Number.isInteger(playerAge) ? getWaiverSignerLabel(playerAge) : "Parent or guardian full name"),
    [playerAge],
  );

  const updateValues = (patch: Partial<WaiverSignFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
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

    const data = (await response.json().catch(() => ({}))) as { error?: string; success?: boolean };

    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to save waiver right now.");
      return;
    }

    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">You&apos;re all set. See you at training.</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
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

      <div className="mt-5 max-h-56 overflow-y-auto rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 p-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
        {WAIVER_SIGN_KEY_TEXT}
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Player first name
            <input
              type="text"
              required
              value={values.playerFirstName}
              onChange={(event) => updateValues({ playerFirstName: event.target.value })}
              className={inputClass}
              autoComplete="given-name"
            />
          </label>
          <label className={labelClass}>
            Player last name
            <input
              type="text"
              required
              value={values.playerLastName}
              onChange={(event) => updateValues({ playerLastName: event.target.value })}
              className={inputClass}
              autoComplete="family-name"
            />
          </label>
        </div>

        <label className={labelClass}>
          Player age
          <input
            type="number"
            required
            min={5}
            max={19}
            inputMode="numeric"
            value={values.playerAge}
            onChange={(event) => updateValues({ playerAge: event.target.value })}
            className={inputClass}
          />
        </label>

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
            {isAdultPlayer ? "Your email" : "Parent or guardian email"}
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

        <label className={labelClass}>
          Medical conditions, injuries, or allergies I should know about (optional)
          <textarea
            rows={3}
            value={values.medicalNotes}
            onChange={(event) => updateValues({ medicalNotes: event.target.value })}
            className={inputClass}
          />
        </label>

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
          <span className="text-sm text-zinc-300">
            OK for Coach Broc to share videos of this player on LCB Training social media and website.
          </span>
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
          {submitting ? "Saving..." : "Sign waiver"}
        </button>
      </form>
    </div>
  );
}
