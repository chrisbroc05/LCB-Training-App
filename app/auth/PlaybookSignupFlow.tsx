"use client";

import type { DatabaseTier, TierKey } from "@/lib/membership";
import Link from "next/link";
import SignupWizard from "@/components/SignupWizard";
import type { SignupRequestPayload } from "@/lib/signup-shared";
import { TWELVE_WEEK_PROGRAM_NAME } from "@/lib/twelve-week-program";
import {
  getPlaybookResumeCheckoutButtonLabel,
  getPlaybookSignupButtonLabel,
  PLAYBOOK_INCLUDED_ITEMS,
} from "@/lib/auth-flow";

type PlaybookSignupFlowProps = {
  selectedTier: TierKey;
  onSelectTier: (tier: TierKey) => void;
  signupError: string;
  signupLoading: boolean;
  resumeLoading: boolean;
  resumeError: string;
  checkoutStatus: string | null;
  isLoggedInWithPendingCheckout: boolean;
  pendingCheckoutTier: DatabaseTier | null;
  onSignup: (payload: SignupRequestPayload) => void | Promise<void>;
  onResumeCheckout: () => void;
  onStartFreeLoggedIn: () => void;
  loginHref: string;
};

function CheckmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 h-4 w-4 shrink-0 text-[#52B788]"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PlaybookSignupFlow({
  selectedTier,
  onSelectTier,
  signupError,
  signupLoading,
  resumeLoading,
  resumeError,
  checkoutStatus,
  isLoggedInWithPendingCheckout,
  pendingCheckoutTier,
  onSignup,
  onResumeCheckout,
  onStartFreeLoggedIn,
  loginHref,
}: PlaybookSignupFlowProps) {
  const isFreeSelected = selectedTier === "free";
  const isBasicSelected = selectedTier === "basic";
  const resumeTier = pendingCheckoutTier ?? "BASIC";

  return (
    <article className="mx-auto w-full max-w-xl">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
          {isLoggedInWithPendingCheckout
            ? "Complete Your Playbook Purchase"
            : isFreeSelected
              ? "Start Free With LCB Training"
              : "Unlock The Next Level Playbook"}
        </h1>
        <p className="mt-3 text-sm text-zinc-400 sm:text-base">
          {isLoggedInWithPendingCheckout
            ? "Your account is ready. Finish checkout to unlock your playbook and training library."
            : isFreeSelected
              ? "Create your free account and get one personal coaching submission from Coach Broc."
              : "Create your account below and get instant access."}
        </p>
      </header>

      {checkoutStatus === "cancelled" && (
        <section className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
          Checkout was cancelled. You can continue checkout below or start free instead.
        </section>
      )}

      {!isFreeSelected && !isLoggedInWithPendingCheckout ? (
        <section
          className={`mt-6 rounded-2xl border-l-4 border-l-[#52B788] bg-[#0A1628] px-5 py-6 sm:px-6 ${
            isBasicSelected
              ? "border border-[#52B788] ring-1 ring-[#52B788]/40"
              : "border border-[#2b3650]"
          }`}
        >
          <h2 className="text-base font-semibold text-[#98b144] sm:text-lg">
            What Is Included -- $59 One Time
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-200 sm:text-base">
            {PLAYBOOK_INCLUDED_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckmarkIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isLoggedInWithPendingCheckout ? (
        <section className="mt-6 space-y-4">
          {resumeError ? <p className="text-sm text-red-300">{resumeError}</p> : null}
          <button
            type="button"
            onClick={onResumeCheckout}
            disabled={resumeLoading}
            className="w-full rounded-full bg-[#22c55e] px-5 py-3.5 text-base font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resumeLoading
              ? "Redirecting to checkout..."
              : getPlaybookResumeCheckoutButtonLabel(resumeTier)}
          </button>
          <p className="text-center text-sm text-zinc-500">
            Not ready to purchase?{" "}
            <button
              type="button"
              onClick={onStartFreeLoggedIn}
              className="text-zinc-400 underline-offset-2 transition hover:text-[#98b144] hover:underline"
            >
              Start free
            </button>{" "}
            and get one personal coaching submission from Coach Broc.
          </p>
        </section>
      ) : (
        <>
          <div className="mt-6">
            <SignupWizard
              title="Create your account"
              subtitle={
                isFreeSelected
                  ? "Create your free account and get one personal coaching submission from Coach Broc."
                  : "Create your account below and get instant access."
              }
              submitLabel={getPlaybookSignupButtonLabel(selectedTier)}
              loading={signupLoading}
              error={signupError}
              loginHref={loginHref}
              onSubmit={onSignup}
            />
          </div>

          {!isFreeSelected ? (
            <section className="mt-8 border-t border-[#2b3650] pt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Want full coaching support?
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                The {TWELVE_WEEK_PROGRAM_NAME} includes unlimited submissions, full Playbook access,
                and weekly check-in calls with Coach Broc.
              </p>
              <Link
                href="/program"
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#52B788] px-4 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10"
              >
                View the 12-Week Program
              </Link>
            </section>
          ) : null}

          <p className="mt-4 text-center text-sm text-zinc-500">
            {isFreeSelected ? (
              <>
                Ready to unlock the playbook instead?{" "}
                <button
                  type="button"
                  onClick={() => onSelectTier("basic")}
                  className="text-zinc-400 underline-offset-2 transition hover:text-[#98b144] hover:underline"
                >
                  Back to playbook purchase
                </button>
              </>
            ) : (
              <>
                Not ready to purchase?{" "}
                <button
                  type="button"
                  onClick={() => onSelectTier("free")}
                  className="text-zinc-400 underline-offset-2 transition hover:text-[#98b144] hover:underline"
                >
                  Start free
                </button>{" "}
                and get one personal coaching submission from Coach Broc.
              </>
            )}
          </p>

        </>
      )}
    </article>
  );
}
