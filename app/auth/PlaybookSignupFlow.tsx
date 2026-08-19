"use client";

import type { DatabaseTier, TierKey } from "@/lib/membership";
import {
  eliteSignupDescription,
  memorableSignupDescription,
} from "@/lib/membership";
import { getTierPricing } from "@/lib/billing";
import {
  getPlaybookResumeCheckoutButtonLabel,
  getPlaybookSignupButtonLabel,
  PLAYBOOK_INCLUDED_ITEMS,
} from "@/lib/auth-flow";

const SIGNUP_FORM_ID = "playbook-signup-form";

type PlaybookSignupFlowProps = {
  selectedTier: TierKey;
  onSelectTier: (tier: TierKey) => void;
  signupName: string;
  onSignupNameChange: (value: string) => void;
  signupEmail: string;
  onSignupEmailChange: (value: string) => void;
  signupPassword: string;
  onSignupPasswordChange: (value: string) => void;
  signupError: string;
  signupLoading: boolean;
  resumeLoading: boolean;
  resumeError: string;
  checkoutStatus: string | null;
  isLoggedInWithPendingCheckout: boolean;
  pendingCheckoutTier: DatabaseTier | null;
  onSignupSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onResumeCheckout: () => void;
  onStartFreeLoggedIn: () => void;
  onSwitchToLogin: () => void;
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

function tierCardClassName(isSelected: boolean) {
  return `rounded-xl border bg-[#0b1324]/60 p-4 transition ${
    isSelected
      ? "border-[#52B788] bg-[#0f1d34] ring-1 ring-[#52B788]/40"
      : "border-[#2b3650] hover:border-[#4f5f83]"
  }`;
}

export default function PlaybookSignupFlow({
  selectedTier,
  onSelectTier,
  signupName,
  onSignupNameChange,
  signupEmail,
  onSignupEmailChange,
  signupPassword,
  onSignupPasswordChange,
  signupError,
  signupLoading,
  resumeLoading,
  resumeError,
  checkoutStatus,
  isLoggedInWithPendingCheckout,
  pendingCheckoutTier,
  onSignupSubmit,
  onResumeCheckout,
  onStartFreeLoggedIn,
  onSwitchToLogin,
}: PlaybookSignupFlowProps) {
  const isFreeSelected = selectedTier === "free";
  const isBasicSelected = selectedTier === "basic";
  const isMemorableSelected = selectedTier === "memorable";
  const isEliteSelected = selectedTier === "elite";
  const memorablePricing = getTierPricing("memorable", "monthly");
  const elitePricing = getTierPricing("elite", "monthly");
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
          <form id={SIGNUP_FORM_ID} className="mt-6 space-y-4" onSubmit={onSignupSubmit}>
            <label className="block">
              <span className="text-sm text-zinc-300">First name</span>
              <input
                type="text"
                placeholder="First name"
                value={signupName}
                onChange={(event) => onSignupNameChange(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-zinc-300">Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={signupEmail}
                onChange={(event) => onSignupEmailChange(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-zinc-300">Password</span>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={signupPassword}
                onChange={(event) => onSignupPasswordChange(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                minLength={8}
                required
              />
            </label>
          </form>

          {!isFreeSelected ? (
            <section className="mt-8 border-t border-[#2b3650] pt-8">
              {(isMemorableSelected || isEliteSelected) && (
                <button
                  type="button"
                  onClick={() => onSelectTier("basic")}
                  className="mb-4 inline-flex h-12 w-full items-center justify-center rounded-full border-2 border-[#52B788] bg-transparent px-6 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/15"
                >
                  Switch Back to Playbook -- $59 One Time
                </button>
              )}

              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Want personal coaching on top of the playbook?
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Add a coaching membership and get direct access to Coach Broc with personal feedback
                every week.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className={tierCardClassName(isMemorableSelected)}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-zinc-200">Memorable</h3>
                    <p className="text-sm font-semibold text-[#98b144]">{memorablePricing.primary}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    {memorableSignupDescription}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectTier("memorable")}
                    className={`mt-3 w-full rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      isMemorableSelected
                        ? "border-[#52B788] bg-[#52B788]/10 text-[#98b144]"
                        : "border-[#2b3650] text-zinc-400 hover:border-[#4f5f83] hover:text-zinc-200"
                    }`}
                  >
                    Select This Instead
                  </button>
                </div>

                <div className={tierCardClassName(isEliteSelected)}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-zinc-200">Elite</h3>
                    <p className="text-sm font-semibold text-[#98b144]">{elitePricing.primary}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    {eliteSignupDescription}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectTier("elite")}
                    className={`mt-3 w-full rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      isEliteSelected
                        ? "border-[#52B788] bg-[#52B788]/10 text-[#98b144]"
                        : "border-[#2b3650] text-zinc-400 hover:border-[#4f5f83] hover:text-zinc-200"
                    }`}
                  >
                    Select This Instead
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {signupError ? <p className="mt-4 text-sm text-red-300">{signupError}</p> : null}

          <button
            type="submit"
            form={SIGNUP_FORM_ID}
            disabled={signupLoading}
            className="mt-8 w-full rounded-full bg-[#22c55e] px-5 py-3.5 text-base font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signupLoading ? "Creating account..." : getPlaybookSignupButtonLabel(selectedTier)}
          </button>

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

          <p className="mt-5 text-center text-sm text-zinc-300">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="underline-offset-2 transition hover:text-[#98b144] hover:underline"
            >
              Log in
            </button>
          </p>
        </>
      )}
    </article>
  );
}
