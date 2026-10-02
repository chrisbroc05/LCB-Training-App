"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AccountRole } from "@/lib/account-shared";
import LegalAgreementFields, {
  createEmptyLegalAgreementValues,
  type LegalAgreementValues,
} from "@/components/LegalAgreementFields";
import {
  buildSignupRequestPayload,
  createInitialSignupWizardState,
  validateSignupAgreementStep,
  validateSignupStep1,
  validateSignupStep2,
  validateSignupStep3,
  validateSignupStep4,
  type SignupRequestPayload,
  type SignupWizardStep,
} from "@/lib/signup-shared";

const inputClassName =
  "mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]";

type SignupWizardProps = {
  title: string;
  subtitle?: string;
  helperText?: string;
  submitLabel?: string;
  loading?: boolean;
  error?: string;
  loginHref?: string;
  onSubmit: (payload: SignupRequestPayload) => void | Promise<void>;
};

function RoleButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-4 text-left text-sm font-semibold transition ${
        selected
          ? "border-[#22c55e] bg-[#22c55e]/10 text-zinc-100"
          : "border-[#2b3650] bg-black text-zinc-300 hover:border-[#3a4a66]"
      }`}
    >
      {label}
    </button>
  );
}

export default function SignupWizard({
  title,
  subtitle,
  helperText,
  submitLabel = "Create account",
  loading = false,
  error,
  loginHref,
  onSubmit,
}: SignupWizardProps) {
  const [state, setState] = useState(() =>
    createInitialSignupWizardState(createEmptyLegalAgreementValues()),
  );
  const [stepError, setStepError] = useState("");

  const stepTitle = useMemo(() => {
    switch (state.step) {
      case 1:
        return "Who's signing up?";
      case 2:
        return "Account details";
      case 3:
        return "Player name";
      case 4:
        return "Player age";
      case 5:
        return "Agreement";
      default:
        return title;
    }
  }, [state.step, title]);

  const goBack = () => {
    setStepError("");
    setState((current) => ({
      ...current,
      step: Math.max(1, current.step - 1) as SignupWizardStep,
    }));
  };

  const goNext = () => {
    setStepError("");

    if (state.step === 1) {
      const validationError = validateSignupStep1(state.accountRole);
      if (validationError) {
        setStepError(validationError);
        return;
      }
      setState((current) => ({ ...current, step: 2 }));
      return;
    }

    if (state.step === 2) {
      if (!state.accountRole) {
        setStepError("Choose who is signing up.");
        return;
      }

      const validationError = validateSignupStep2({
        accountRole: state.accountRole,
        email: state.email,
        password: state.password,
        accountHolderName: state.accountHolderName,
      });
      if (validationError) {
        setStepError(validationError);
        return;
      }
      setState((current) => ({ ...current, step: 3 }));
      return;
    }

    if (state.step === 3) {
      const validationError = validateSignupStep3(state.playerFirstName, state.playerLastName);
      if (validationError) {
        setStepError(validationError);
        return;
      }
      setState((current) => ({ ...current, step: 4 }));
      return;
    }

    if (state.step === 4) {
      const validationError = validateSignupStep4(state.playerAge);
      if (validationError) {
        setStepError(validationError);
        return;
      }

      setState((current) => ({
        ...current,
        step: 5,
        legalAgreement: {
          ...current.legalAgreement,
          playerAge: current.playerAge,
          agreementRole: current.accountRole === "PARENT" ? "parent" : current.legalAgreement.agreementRole,
        },
      }));
    }
  };

  const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStepError("");

    if (!state.accountRole) {
      setStepError("Choose who is signing up.");
      return;
    }

    const validationError = validateSignupAgreementStep({
      accountRole: state.accountRole,
      accountHolderName: state.accountHolderName,
      accountEmail: state.email,
      playerAge: state.playerAge,
      legalAgreement: state.legalAgreement,
    });

    if (validationError) {
      setStepError(validationError);
      return;
    }

    const payload = buildSignupRequestPayload(state);
    if (!payload) {
      setStepError("Unable to finish signup. Check your details and try again.");
      return;
    }

    await onSubmit(payload);
  };

  const displayError = stepError || error || "";

  return (
    <div className="space-y-4">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Step {state.step} of 5
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-100">{stepTitle}</h2>
        {state.step === 1 ? (
          <>
            {subtitle ? <p className="mt-3 text-sm text-zinc-400">{subtitle}</p> : null}
            <p className="mt-3 text-sm text-zinc-400">
              Signing up your kid? Pick parent and we&apos;ll set it up for them.
            </p>
          </>
        ) : null}
        {helperText && state.step === 1 ? (
          <p className="mt-2 text-sm text-zinc-500">{helperText}</p>
        ) : null}
      </header>

      {state.step === 1 ? (
        <div className="space-y-3">
          <RoleButton
            selected={state.accountRole === "PLAYER"}
            label="Player"
            onClick={() =>
              setState((current) => ({
                ...current,
                accountRole: "PLAYER" as AccountRole,
              }))
            }
          />
          <RoleButton
            selected={state.accountRole === "PARENT"}
            label="Parent or guardian"
            onClick={() =>
              setState((current) => ({
                ...current,
                accountRole: "PARENT" as AccountRole,
              }))
            }
          />
        </div>
      ) : null}

      {state.step === 2 ? (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-300">Email</span>
            <input
              type="email"
              value={state.email}
              onChange={(event) => setState((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              className={inputClassName}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-300">Password</span>
            <input
              type="password"
              value={state.password}
              onChange={(event) => setState((current) => ({ ...current, password: event.target.value }))}
              placeholder="At least 8 characters"
              minLength={8}
              className={inputClassName}
              required
            />
          </label>
          {state.accountRole === "PARENT" ? (
            <label className="block">
              <span className="text-sm text-zinc-300">Your full name</span>
              <input
                type="text"
                value={state.accountHolderName}
                onChange={(event) =>
                  setState((current) => ({ ...current, accountHolderName: event.target.value }))
                }
                placeholder="First and last name"
                className={inputClassName}
                required
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {state.step === 3 ? (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-300">Player first name</span>
            <input
              type="text"
              value={state.playerFirstName}
              onChange={(event) =>
                setState((current) => ({ ...current, playerFirstName: event.target.value }))
              }
              placeholder="First name"
              className={inputClassName}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-300">Player last name</span>
            <input
              type="text"
              value={state.playerLastName}
              onChange={(event) =>
                setState((current) => ({ ...current, playerLastName: event.target.value }))
              }
              placeholder="Last name"
              className={inputClassName}
              required
            />
          </label>
        </div>
      ) : null}

      {state.step === 4 ? (
        <label className="block">
          <span className="text-sm text-zinc-300">Player age</span>
          <input
            type="number"
            min={5}
            max={25}
            inputMode="numeric"
            value={state.playerAge}
            onChange={(event) => setState((current) => ({ ...current, playerAge: event.target.value }))}
            placeholder="5-25"
            className={inputClassName}
            required
          />
        </label>
      ) : null}

      {state.step === 5 && state.accountRole ? (
        <form className="space-y-4" onSubmit={(event) => void handleCreateAccount(event)}>
          <LegalAgreementFields
            values={state.legalAgreement}
            onChange={(legalAgreement) => setState((current) => ({ ...current, legalAgreement }))}
            signupContext={{
              accountRole: state.accountRole,
              accountHolderName: state.accountHolderName,
              accountEmail: state.email,
              playerAge: state.playerAge,
            }}
          />
          {displayError ? <p className="text-sm text-red-300">{displayError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-[#2b3650] px-5 py-3 text-sm font-semibold text-zinc-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:opacity-60"
            >
              {loading ? "Creating account..." : submitLabel}
            </button>
          </div>
        </form>
      ) : null}

      {state.step < 5 ? (
        <>
          {displayError ? <p className="text-sm text-red-300">{displayError}</p> : null}
          <div className="flex flex-wrap gap-2">
            {state.step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-full border border-[#2b3650] px-5 py-3 text-sm font-semibold text-zinc-300"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={goNext}
              className="flex-1 rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Next
            </button>
          </div>
        </>
      ) : null}

      {loginHref ? (
        <p className="text-center text-sm text-zinc-300">
          Already have an account?{" "}
          <Link href={loginHref} className="underline-offset-2 transition hover:text-[#98b144] hover:underline">
            Log in
          </Link>
        </p>
      ) : null}
    </div>
  );
}
