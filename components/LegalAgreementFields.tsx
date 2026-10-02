"use client";

import Link from "next/link";
import type { LegalAgreementRole } from "@/lib/legal-shared";
import {
  LEGAL_ADULT_AGE,
  LEGAL_MAX_PLAYER_AGE,
  LEGAL_MIN_PLAYER_AGE,
  LEGAL_PAGE_PATHS,
  parseLegalPlayerAge,
  validateAcceptedByName,
  validateParentConsentEmail,
} from "@/lib/legal-shared";

export type LegalAgreementValues = {
  termsAccepted: boolean;
  playerAge: string;
  acceptedByName: string;
  agreementRole: LegalAgreementRole;
  parentConsentName: string;
  parentConsentEmail: string;
  mediaConsent: boolean;
};

type LegalAgreementFieldsProps = {
  values: LegalAgreementValues;
  onChange: (values: LegalAgreementValues) => void;
  error?: string;
  compact?: boolean;
  showMediaConsent?: boolean;
  accountEmail?: string;
};

export default function LegalAgreementFields({
  values,
  onChange,
  error,
  compact = false,
  showMediaConsent = true,
}: LegalAgreementFieldsProps) {
  const labelClass = compact ? "text-xs text-zinc-400" : "text-sm text-zinc-300";
  const inputClass = compact
    ? "mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
    : "mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]";

  const parsedAge = parseLegalPlayerAge(values.playerAge);
  const isMinor = parsedAge != null && parsedAge < LEGAL_ADULT_AGE;
  const isAdult = parsedAge != null && parsedAge >= LEGAL_ADULT_AGE;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <label className="block">
        <span className={labelClass}>Player&apos;s age</span>
        <input
          type="number"
          min={LEGAL_MIN_PLAYER_AGE}
          max={LEGAL_MAX_PLAYER_AGE}
          inputMode="numeric"
          value={values.playerAge}
          onChange={(event) => onChange({ ...values, playerAge: event.target.value })}
          placeholder={`${LEGAL_MIN_PLAYER_AGE}-${LEGAL_MAX_PLAYER_AGE}`}
          className={inputClass}
          required
        />
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={values.termsAccepted}
          onChange={(event) =>
            onChange({ ...values, termsAccepted: event.target.checked })
          }
          className="mt-1 h-4 w-4 shrink-0 accent-[#22c55e]"
        />
        <span className={labelClass}>
          {isMinor ? (
            <>
              I am the player&apos;s parent or legal guardian, and I agree to the{" "}
            </>
          ) : (
            <>I am 18 or older, or the player&apos;s parent or legal guardian, and I agree to the </>
          )}
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
          {isMinor ? " on their behalf." : "."}
        </span>
      </label>

      {isMinor ? (
        <>
          <p className={labelClass}>
            Under 18? Have a parent or guardian fill out this part. We&apos;ll email them to confirm.
          </p>
          <label className="block">
            <span className={labelClass}>Parent or guardian full name</span>
            <input
              type="text"
              value={values.parentConsentName}
              onChange={(event) =>
                onChange({ ...values, parentConsentName: event.target.value })
              }
              placeholder="First and last name"
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Parent or guardian email</span>
            <input
              type="email"
              value={values.parentConsentEmail}
              onChange={(event) =>
                onChange({ ...values, parentConsentEmail: event.target.value })
              }
              placeholder="name@example.com"
              className={inputClass}
              required
            />
          </label>
        </>
      ) : null}

      {isAdult ? (
        <>
          <label className="block">
            <span className={labelClass}>Full name of the person agreeing</span>
            <input
              type="text"
              value={values.acceptedByName}
              onChange={(event) =>
                onChange({ ...values, acceptedByName: event.target.value })
              }
              placeholder="First and last name"
              className={inputClass}
              required
            />
          </label>

          <fieldset>
            <legend className={labelClass}>Who is agreeing?</legend>
            <div className={`mt-2 space-y-2 ${compact ? "text-sm" : ""}`}>
              <label className="flex items-center gap-2 text-zinc-300">
                <input
                  type="radio"
                  name="legalAgreementRole"
                  checked={values.agreementRole === "player"}
                  onChange={() => onChange({ ...values, agreementRole: "player" })}
                  className="accent-[#22c55e]"
                />
                I am the player (18+)
              </label>
              <label className="flex items-center gap-2 text-zinc-300">
                <input
                  type="radio"
                  name="legalAgreementRole"
                  checked={values.agreementRole === "parent"}
                  onChange={() => onChange({ ...values, agreementRole: "parent" })}
                  className="accent-[#22c55e]"
                />
                I am the player&apos;s parent or guardian
              </label>
            </div>
          </fieldset>
        </>
      ) : null}

      {showMediaConsent ? (
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={values.mediaConsent}
            onChange={(event) =>
              onChange({ ...values, mediaConsent: event.target.checked })
            }
            className="mt-1 h-4 w-4 shrink-0 accent-[#22c55e]"
          />
          <span className={labelClass}>
            OK for Coach Broc to share my videos on LCB Training social media and website.
          </span>
        </label>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

export function createEmptyLegalAgreementValues(): LegalAgreementValues {
  return {
    termsAccepted: false,
    playerAge: "",
    acceptedByName: "",
    agreementRole: "player",
    parentConsentName: "",
    parentConsentEmail: "",
    mediaConsent: false,
  };
}

export function validateLegalAgreementValues(values: LegalAgreementValues) {
  if (!values.termsAccepted) {
    return "You must agree to the Terms of Service, Privacy Policy, and Waiver.";
  }

  const playerAge = parseLegalPlayerAge(values.playerAge);
  if (playerAge == null) {
    return `Enter the player's age (${LEGAL_MIN_PLAYER_AGE}-${LEGAL_MAX_PLAYER_AGE}).`;
  }

  if (playerAge < LEGAL_ADULT_AGE) {
    const parentNameError = validateAcceptedByName(values.parentConsentName);
    if (parentNameError) {
      return "Enter the parent or guardian full name (at least first and last).";
    }

    const parentEmailError = validateParentConsentEmail(values.parentConsentEmail);
    if (parentEmailError) {
      return parentEmailError;
    }

    return null;
  }

  const nameError = validateAcceptedByName(values.acceptedByName);
  if (nameError) {
    return nameError;
  }

  return null;
}

export function buildLegalAcceptancePayload(values: LegalAgreementValues) {
  const playerAge = parseLegalPlayerAge(values.playerAge);
  if (playerAge == null) {
    return null;
  }

  if (playerAge < LEGAL_ADULT_AGE) {
    return {
      playerAge,
      acceptedByName: values.parentConsentName.trim(),
      acceptedAsParent: true,
      parentConsentName: values.parentConsentName.trim(),
      parentConsentEmail: values.parentConsentEmail.trim().toLowerCase(),
      mediaConsent: values.mediaConsent,
    };
  }

  return {
    playerAge,
    acceptedByName: values.acceptedByName.trim(),
    acceptedAsParent: values.agreementRole === "parent",
    parentConsentName: null as string | null,
    parentConsentEmail: null as string | null,
    mediaConsent: values.mediaConsent,
  };
}
