"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { keyToDatabaseTier, membershipTiers, type TierKey } from "@/lib/membership";
import type { DatabaseTier } from "@/lib/membership";
import BrandLogo from "@/app/BrandLogo";
import BillingFrequencyToggle from "@/app/BillingFrequencyToggle";
import AnnualSavingsBadge from "@/app/AnnualSavingsBadge";
import OneTimePaymentBadge from "@/app/OneTimePaymentBadge";
import {
  getAnnualSavings,
  getTierPricing,
  isOneTimeTier,
  parseBillingFrequency,
  usesBillingFrequencyToggle,
  type BillingFrequency,
} from "@/lib/billing";
import {
  FREE_SWING_AUTH_REDIRECT,
  getPostAuthRedirectPath,
  isFreeSwingAuthFlow,
  markPendingCoachingWelcome,
} from "@/lib/free-swing-flow";
import { isPlaybookSignupFlow } from "@/lib/auth-flow";
import PlaybookSignupFlow from "@/app/auth/PlaybookSignupFlow";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const [manuallySelectedTier, setManuallySelectedTier] = useState<TierKey | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [pendingCheckoutTier, setPendingCheckoutTier] = useState<
    DatabaseTier | null
  >(null);

  const tierQueryParam = searchParams.get("tier");
  const normalizedTierQuery = tierQueryParam?.toLowerCase();
  const preselectedTierFromQuery = membershipTiers.find(
    (tier) => tier.key === normalizedTierQuery,
  )?.key;
  const modeQuery = searchParams.get("mode")?.toLowerCase();
  const shouldStartOnSignup = modeQuery === "signup" || Boolean(preselectedTierFromQuery);
  const [authMode, setAuthMode] = useState<AuthMode>(shouldStartOnSignup ? "signup" : "login");
  const checkoutStatus = searchParams.get("checkout");
  const billingQueryParam = searchParams.get("billing");
  const redirectParam = searchParams.get("redirect");
  const isFreeSwingFlow = isFreeSwingAuthFlow(tierQueryParam, redirectParam);
  const isPlaybookFlow = isPlaybookSignupFlow(tierQueryParam, redirectParam);
  const postAuthPath = getPostAuthRedirectPath(redirectParam);
  const selectedTier: TierKey =
    manuallySelectedTier ??
    preselectedTierFromQuery ??
    (isPlaybookFlow ? "basic" : "free");
  const selectedDatabaseTier: DatabaseTier = keyToDatabaseTier[selectedTier];
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>(
    parseBillingFrequency(billingQueryParam),
  );

  useEffect(() => {
    if (!isFreeSwingFlow && !isPlaybookFlow) {
      setSessionChecked(true);
      return;
    }

    fetch("/api/auth/session")
      .then((response) => response.json())
      .then(
        (session: {
          user?: {
            email?: string | null;
            membershipTier?: DatabaseTier;
            pendingCheckoutTier?: DatabaseTier | null;
          };
        }) => {
          if (session?.user) {
            const sessionPendingCheckout = session.user.pendingCheckoutTier ?? null;
            setPendingCheckoutTier(sessionPendingCheckout);

            if (isFreeSwingFlow) {
              setHasActiveSession(true);
              window.location.replace(postAuthPath);
              return;
            }

            if (
              isPlaybookFlow &&
              sessionPendingCheckout &&
              session.user.membershipTier === "FREE"
            ) {
              setHasActiveSession(true);
              setSessionChecked(true);
              return;
            }

            if (isPlaybookFlow && session.user.membershipTier === "FREE") {
              setHasActiveSession(true);
              window.location.replace("/upgrade");
              return;
            }

            if (isPlaybookFlow && session.user.membershipTier !== "FREE") {
              setHasActiveSession(true);
              window.location.replace("/dashboard");
              return;
            }
          }

          setSessionChecked(true);
        },
      )
      .catch(() => {
        setSessionChecked(true);
      });
  }, [isFreeSwingFlow, isPlaybookFlow, postAuthPath]);

  if (isFreeSwingFlow && (!sessionChecked || hasActiveSession)) {
    return (
      <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        <section className="w-full max-w-lg rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-8 text-center">
          <p className="text-sm text-zinc-300">Loading your account...</p>
        </section>
      </div>
    );
  }

  if (isPlaybookFlow && !sessionChecked) {
    return (
      <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        <section className="w-full max-w-lg rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-8 text-center">
          <p className="text-sm text-zinc-300">Loading your account...</p>
        </section>
      </div>
    );
  }

  const isLoggedInWithPendingCheckout = Boolean(
    isPlaybookFlow && hasActiveSession && pendingCheckoutTier,
  );
  const resumeCheckoutTier: DatabaseTier =
    pendingCheckoutTier ?? selectedDatabaseTier;

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      callbackUrl: postAuthPath,
      redirect: false,
    });

    setLoginLoading(false);

    if (!result || result.error) {
      setLoginError("Invalid email or password.");
      return;
    }

    window.location.href = result.url ?? postAuthPath;
  };

  const freeSwingLoginForm = (
    <form className="mt-6 space-y-4" onSubmit={handleLogin}>
      <label className="block">
        <span className="text-sm text-zinc-300">Email</span>
        <input
          type="email"
          placeholder="you@example.com"
          value={loginEmail}
          onChange={(event) => setLoginEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm text-zinc-300">Password</span>
        <input
          type="password"
          placeholder="Your password"
          value={loginPassword}
          onChange={(event) => setLoginPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
          required
        />
      </label>
      {loginError && <p className="text-sm text-red-300">{loginError}</p>}
      <button
        type="submit"
        disabled={loginLoading}
        className="w-full rounded-full bg-[#22c55e] px-5 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loginLoading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSignupLoading(true);
    setSignupError("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        selectedMembershipTier: selectedDatabaseTier,
        signupSource: isPlaybookFlow ? "playbook" : "standard",
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setSignupLoading(false);
      setSignupError(data.error ?? "Unable to create account.");
      return;
    }

    const loginResult = await signIn("credentials", {
      email: signupEmail,
      password: signupPassword,
      callbackUrl: "/auth",
      redirect: false,
    });

    if (!loginResult || loginResult.error) {
      setSignupLoading(false);
      setSignupError("Account created, but auto-login failed. Please log in manually.");
      return;
    }

    if (selectedDatabaseTier === "FREE") {
      setSignupLoading(false);
      if (redirectParam === FREE_SWING_AUTH_REDIRECT) {
        markPendingCoachingWelcome();
        window.location.href = "/coaching-submissions";
      } else {
        window.location.href = "/dashboard";
      }
      return;
    }

    const checkoutResponse = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        membershipTier: selectedDatabaseTier,
        billingFrequency,
        checkoutSource: isPlaybookFlow ? "playbook" : "standard",
      }),
    });

    if (!checkoutResponse.ok) {
      const data = (await checkoutResponse.json().catch(() => ({}))) as { error?: string };
      setSignupLoading(false);
      setSignupError(data.error ?? "Unable to start checkout. Please try again.");
      return;
    }

    const checkoutData = (await checkoutResponse.json()) as { url?: string };
    if (!checkoutData.url) {
      setSignupLoading(false);
      setSignupError("Unable to start checkout. Please try again.");
      return;
    }

    setSignupLoading(false);
    window.location.href = checkoutData.url;
  };

  const handleResumeCheckout = async () => {
    setResumeLoading(true);
    setResumeError("");

    const checkoutResponse = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        membershipTier: resumeCheckoutTier,
        billingFrequency,
        checkoutSource: isPlaybookFlow ? "playbook" : "standard",
      }),
    });

    if (!checkoutResponse.ok) {
      const data = (await checkoutResponse.json().catch(() => ({}))) as { error?: string };
      setResumeLoading(false);
      setResumeError(data.error ?? "Unable to start checkout. Please try again.");
      return;
    }

    const checkoutData = (await checkoutResponse.json()) as { url?: string };
    if (!checkoutData.url) {
      setResumeLoading(false);
      setResumeError("Unable to start checkout. Please try again.");
      return;
    }

    setResumeLoading(false);
    window.location.href = checkoutData.url;
  };

  const handleStartFreeLoggedIn = async () => {
    setResumeLoading(true);
    setResumeError("");

    const response = await fetch("/api/auth/clear-pending-checkout", {
      method: "POST",
    });

    if (!response.ok) {
      setResumeLoading(false);
      setResumeError("Unable to switch to free access right now. Please try again.");
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="w-full max-w-5xl rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-7 md:p-9">
        <div className="mx-auto mb-6 flex justify-center">
          <div className="relative h-14 w-36 sm:h-16 sm:w-40">
            <BrandLogo className="object-contain" />
          </div>
        </div>
      {checkoutStatus === "cancelled" && !isPlaybookFlow ? (
        <section className="mb-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
          Checkout was cancelled. Your account is ready, and you can choose a plan again any time.
        </section>
      ) : null}

        {authMode === "login" && !isFreeSwingFlow ? (
          <article className="mx-auto w-full max-w-md rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
            <h1 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">Member Login</h1>
            <p className="mt-2 text-center text-zinc-300">
              Access your training dashboard and member-only drill content.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="text-sm text-zinc-300">Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-300">Password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                  required
                />
              </label>
              {loginError && <p className="text-sm text-red-300">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-full bg-[#22c55e] px-5 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </form>
            <div className="mt-5 flex flex-col gap-2 text-center text-sm">
              <a
                href="mailto:chrisbroc05@gmail.com?subject=LCB%20Training%20Password%20Help"
                className="text-zinc-300 underline-offset-2 transition hover:text-[#98b144] hover:underline"
              >
                Forgot password?
              </a>
              <button
                type="button"
                onClick={() => {
                  setLoginError("");
                  setSignupError("");
                  setAuthMode("signup");
                }}
                className="text-zinc-300 underline-offset-2 transition hover:text-[#98b144] hover:underline"
              >
                Don&apos;t have an account? Sign up
              </button>
            </div>
          </article>
        ) : isFreeSwingFlow && authMode === "login" ? (
          <article className="mx-auto w-full max-w-lg rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
            <section className="rounded-2xl border border-[#2b3650] bg-[#0b1324] px-5 py-6 sm:px-7 sm:py-8">
              <h1 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">
                Welcome back
              </h1>
              <p className="mt-3 text-center text-sm text-zinc-400">
                Log in to continue to your coaching submissions.
              </p>
            </section>

            {freeSwingLoginForm}

            <p className="mt-5 text-center text-sm text-zinc-300">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setLoginError("");
                  setSignupError("");
                  setAuthMode("signup");
                }}
                className="underline-offset-2 transition hover:text-[#98b144] hover:underline"
              >
                Sign up
              </button>
            </p>
          </article>
        ) : isFreeSwingFlow ? (
          <article className="mx-auto w-full max-w-lg rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
            <section className="rounded-2xl border border-[#2b3650] bg-[#0b1324] px-5 py-6 sm:px-7 sm:py-8">
              <h1 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">
                You are one step away
              </h1>
              <ul className="mt-5 space-y-3 text-sm sm:text-base">
                <li className="flex items-start gap-3 text-[#52B788]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#52B788]" />
                  <span>
                    Submit your swing video and get personal feedback from Coach Broc within 48
                    hours
                  </span>
                </li>
                <li className="flex items-start gap-3 text-[#52B788]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#52B788]" />
                  <span>
                    Submit a mental game question and get a personal response from Coach Broc
                  </span>
                </li>
              </ul>
              <p className="mt-5 text-center text-sm text-zinc-500">
                Create your free account below to get started. No credit card required.
              </p>
            </section>

            <form className="mt-6 space-y-4" onSubmit={handleSignup}>
              <label className="block">
                <span className="text-sm text-zinc-300">First name</span>
                <input
                  type="text"
                  placeholder="First name"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
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
                  onChange={(event) => setSignupEmail(event.target.value)}
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
                  onChange={(event) => setSignupPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                  minLength={8}
                  required
                />
              </label>

              {signupError && <p className="text-sm text-red-300">{signupError}</p>}

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-full bg-[#22c55e] px-5 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signupLoading ? "Creating account..." : "Create My Free Account"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-300">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setLoginError("");
                  setSignupError("");
                  setAuthMode("login");
                }}
                className="underline-offset-2 transition hover:text-[#98b144] hover:underline"
              >
                Log in
              </button>
            </p>
          </article>
        ) : isPlaybookFlow && authMode === "login" ? (
          <article className="mx-auto w-full max-w-md rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
            <h1 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-center text-sm text-zinc-400">
              Log in to continue unlocking The Next Level Playbook.
            </p>
            {freeSwingLoginForm}
            <p className="mt-5 text-center text-sm text-zinc-300">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setLoginError("");
                  setSignupError("");
                  setAuthMode("signup");
                }}
                className="underline-offset-2 transition hover:text-[#98b144] hover:underline"
              >
                Sign up
              </button>
            </p>
          </article>
        ) : isPlaybookFlow ? (
          <PlaybookSignupFlow
            selectedTier={selectedTier}
            onSelectTier={setManuallySelectedTier}
            signupName={signupName}
            onSignupNameChange={setSignupName}
            signupEmail={signupEmail}
            onSignupEmailChange={setSignupEmail}
            signupPassword={signupPassword}
            onSignupPasswordChange={setSignupPassword}
            signupError={signupError}
            signupLoading={signupLoading}
            resumeLoading={resumeLoading}
            resumeError={resumeError}
            checkoutStatus={checkoutStatus}
            isLoggedInWithPendingCheckout={isLoggedInWithPendingCheckout}
            pendingCheckoutTier={pendingCheckoutTier}
            onSignupSubmit={handleSignup}
            onResumeCheckout={handleResumeCheckout}
            onStartFreeLoggedIn={handleStartFreeLoggedIn}
            onSwitchToLogin={() => {
              setLoginError("");
              setSignupError("");
              setAuthMode("login");
            }}
          />
        ) : (
          <article className="mx-auto w-full max-w-5xl rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
            <h1 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">Create Account</h1>
            <p className="mt-2 text-center text-zinc-300">
              Choose your membership and get started with LCB Training.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSignup}>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm text-zinc-300">Name</span>
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={signupName}
                    onChange={(event) => setSignupName(event.target.value)}
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
                    onChange={(event) => setSignupEmail(event.target.value)}
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
                    onChange={(event) => setSignupPassword(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                    minLength={8}
                    required
                  />
                </label>
              </div>

              <div className="pt-2">
                <p className="text-sm font-medium text-zinc-300">Select your membership tier</p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <BillingFrequencyToggle
                    value={billingFrequency}
                    onChange={setBillingFrequency}
                  />
                  <p className="text-xs text-zinc-400">
                    Monthly and annual pricing applies to Memorable and Elite only.
                  </p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  {membershipTiers.map((tier) => {
                    const isSelected = selectedTier === tier.key;
                    const pricing = getTierPricing(tier.key, billingFrequency);
                    const oneTimeTier = isOneTimeTier(tier.key);
                    const annualSavings =
                      usesBillingFrequencyToggle(tier.key) && billingFrequency === "annual"
                        ? getAnnualSavings(tier.key)
                        : null;

                    return (
                      <button
                        key={tier.key}
                        type="button"
                        onClick={() => setManuallySelectedTier(tier.key)}
                        className={`h-full rounded-2xl border p-5 text-left transition ${
                          isSelected
                            ? "border-[#52B788] bg-[#0f1d34]"
                            : "border-[#2b3650] bg-[#0b1324] hover:border-[#4f5f83]"
                        }`}
                      >
                        <h2 className="text-xl font-semibold text-zinc-100">{tier.name}</h2>
                        {oneTimeTier ? (
                          <div className="mt-2">
                            <OneTimePaymentBadge />
                          </div>
                        ) : null}
                        {annualSavings ? (
                          <div className="mt-2">
                            <AnnualSavingsBadge amount={annualSavings} />
                          </div>
                        ) : null}
                        <p className="mt-2 text-xl font-bold text-[#98b144]">{pricing.primary}</p>
                        {pricing.secondary ? (
                          <p className="mt-1 text-sm text-zinc-400">{pricing.secondary}</p>
                        ) : null}
                        <ul className="mt-4 space-y-2 text-sm text-zinc-200">
                          {tier.features.map((feature) => (
                            <li key={`${tier.key}-${feature}`} className="flex items-start gap-2">
                              <span className="mt-1 h-2 w-2 rounded-full bg-[#22c55e]" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              <input type="hidden" name="plan" value={selectedTier} />
              {signupError && <p className="text-sm text-red-300">{signupError}</p>}

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-full border border-[#22c55e] bg-[#22c55e]/10 px-5 py-3 font-semibold text-[#9df3bd] transition hover:bg-[#22c55e]/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {signupLoading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-300">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setLoginError("");
                  setSignupError("");
                  setAuthMode("login");
                }}
                className="underline-offset-2 transition hover:text-[#98b144] hover:underline"
              >
                Log in
              </button>
            </p>
          </article>
        )}
      </section>
    </div>
  );
}
