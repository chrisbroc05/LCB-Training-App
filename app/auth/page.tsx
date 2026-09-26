"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { keyToDatabaseTier, membershipTiers, type TierKey } from "@/lib/membership";
import type { DatabaseTier } from "@/lib/membership";
import BrandLogo from "@/app/BrandLogo";
import { parseBillingFrequency, type BillingFrequency } from "@/lib/billing";
import {
  FREE_SWING_AUTH_REDIRECT,
  getAuthRedirectParam,
  getPostAuthRedirectPath,
  isFreeSwingAuthFlow,
  markPendingCoachingWelcome,
} from "@/lib/free-swing-flow";
import {
  buildAuthPageHref,
  isPlaybookSignupFlow,
  isProgramSignupFlow,
} from "@/lib/auth-flow";
import PlaybookSignupFlow from "@/app/auth/PlaybookSignupFlow";
import GeneralAuthFlow from "@/app/auth/GeneralAuthFlow";
import ProgramSignupFlow from "@/app/auth/ProgramSignupFlow";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}

async function startMembershipCheckout(
  membershipTier: DatabaseTier,
  billingFrequency: BillingFrequency,
  checkoutSource: string,
): Promise<{ url?: string; error?: string }> {
  if (membershipTier === "BASIC") {
    const response = await fetch("/api/stripe/checkout/basic", { method: "POST" });
    return (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  }

  if (membershipTier === "TWELVE_WEEK") {
    const response = await fetch("/api/stripe/checkout/twelve-week", { method: "POST" });
    return (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  }

  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      membershipTier,
      billingFrequency,
      checkoutSource,
    }),
  });

  return (await response.json().catch(() => ({}))) as { url?: string; error?: string };
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
  const [pendingCheckoutTier, setPendingCheckoutTier] = useState<DatabaseTier | null>(null);

  const tierQueryParam = searchParams.get("tier");
  const normalizedTierQuery = tierQueryParam?.toLowerCase();
  const preselectedTierFromQuery = membershipTiers.find((tier) => tier.key === normalizedTierQuery)?.key;
  const modeQuery = searchParams.get("mode")?.toLowerCase();
  const redirectParam = searchParams.get("redirect");
  const callbackUrlParam = searchParams.get("callbackUrl");
  const authRedirectParam = getAuthRedirectParam(redirectParam, callbackUrlParam);
  const isFreeSwingFlow = isFreeSwingAuthFlow(tierQueryParam, authRedirectParam);
  const isProgramFlow = isProgramSignupFlow(tierQueryParam, authRedirectParam);
  const isPlaybookFlow = isPlaybookSignupFlow(tierQueryParam, authRedirectParam);
  const shouldStartOnSignup =
    modeQuery === "login"
      ? false
      : modeQuery === "signup" ||
        Boolean(preselectedTierFromQuery) ||
        isProgramFlow ||
        (isPlaybookFlow && modeQuery !== "login");
  const [authMode, setAuthMode] = useState<AuthMode>(shouldStartOnSignup ? "signup" : "login");
  const checkoutStatus = searchParams.get("checkout");
  const billingQueryParam = searchParams.get("billing");
  const postAuthPath = getPostAuthRedirectPath(redirectParam, callbackUrlParam);
  const loginHref = buildAuthPageHref({ mode: "login", searchParams });
  const signupHref = buildAuthPageHref({ mode: "signup", searchParams });
  const selectedTier: TierKey =
    manuallySelectedTier ?? preselectedTierFromQuery ?? (isPlaybookFlow ? "basic" : "free");
  const selectedDatabaseTier: DatabaseTier = keyToDatabaseTier[selectedTier];
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>(
    parseBillingFrequency(billingQueryParam),
  );

  useEffect(() => {
    if (modeQuery === "login") {
      setAuthMode("login");
      return;
    }

    if (modeQuery === "signup" || preselectedTierFromQuery || isProgramFlow || isPlaybookFlow) {
      setAuthMode("signup");
    }
  }, [modeQuery, preselectedTierFromQuery, isProgramFlow, isPlaybookFlow]);

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
  const resumeCheckoutTier: DatabaseTier = pendingCheckoutTier ?? selectedDatabaseTier;

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

    const destinationParams = new URLSearchParams();
    if (redirectParam) {
      destinationParams.set("redirect", redirectParam);
    }
    if (callbackUrlParam) {
      destinationParams.set("callbackUrl", callbackUrlParam);
    }

    const destinationQuery = destinationParams.toString();
    const destinationResponse = await fetch(
      `/api/auth/post-login-redirect${destinationQuery ? `?${destinationQuery}` : ""}`,
    );
    const destinationPayload = (await destinationResponse.json().catch(() => ({}))) as {
      path?: string;
    };

    window.location.href = destinationPayload.path ?? postAuthPath;
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

    const membershipTierForSignup = isPlaybookFlow ? selectedDatabaseTier : "FREE";
    const signupSource = isProgramFlow ? "program" : isPlaybookFlow ? "playbook" : "standard";

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        selectedMembershipTier: membershipTierForSignup,
        signupSource,
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

    if (isFreeSwingFlow || authRedirectParam === FREE_SWING_AUTH_REDIRECT) {
      setSignupLoading(false);
      markPendingCoachingWelcome();
      window.location.href = "/coaching-submissions";
      return;
    }

    if (isProgramFlow) {
      const checkoutData = await startMembershipCheckout("TWELVE_WEEK", billingFrequency, "program");
      if (!checkoutData.url) {
        setSignupLoading(false);
        setSignupError(checkoutData.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      setSignupLoading(false);
      window.location.href = checkoutData.url;
      return;
    }

    if (isPlaybookFlow && selectedDatabaseTier !== "FREE") {
      const checkoutData = await startMembershipCheckout(
        selectedDatabaseTier,
        billingFrequency,
        "playbook",
      );
      if (!checkoutData.url) {
        setSignupLoading(false);
        setSignupError(checkoutData.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      setSignupLoading(false);
      window.location.href = checkoutData.url;
      return;
    }

    setSignupLoading(false);
    window.location.href = postAuthPath;
  };

  const handleResumeCheckout = async () => {
    setResumeLoading(true);
    setResumeError("");

    const checkoutData = await startMembershipCheckout(
      resumeCheckoutTier,
      billingFrequency,
      "playbook",
    );

    if (!checkoutData.url) {
      setResumeLoading(false);
      setResumeError(checkoutData.error ?? "Unable to start checkout. Please try again.");
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
        {checkoutStatus === "cancelled" && isPlaybookFlow ? (
          <section className="mb-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
            Checkout was cancelled. Your account is ready, and you can choose a plan again any time.
          </section>
        ) : null}

        {authMode === "login" && isFreeSwingFlow ? (
          <article className="mx-auto w-full max-w-lg rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
            <section className="rounded-2xl border border-[#2b3650] bg-[#0b1324] px-5 py-6 sm:px-7 sm:py-8">
              <h1 className="text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">
                Welcome back.
              </h1>
              <p className="mt-3 text-center text-sm text-zinc-400">
                Log in to continue to your coaching submissions.
              </p>
            </section>

            {freeSwingLoginForm}

            <p className="mt-5 text-center text-sm text-zinc-300">
              Don&apos;t have an account?{" "}
              <Link href={signupHref} className="underline-offset-2 transition hover:text-[#98b144] hover:underline">
                Sign up
              </Link>
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
              <Link href={loginHref} className="underline-offset-2 transition hover:text-[#98b144] hover:underline">
                Log in
              </Link>
            </p>
          </article>
        ) : authMode === "signup" && isProgramFlow ? (
          <ProgramSignupFlow
            loginHref={loginHref}
            signupName={signupName}
            onSignupNameChange={setSignupName}
            signupEmail={signupEmail}
            onSignupEmailChange={setSignupEmail}
            signupPassword={signupPassword}
            onSignupPasswordChange={setSignupPassword}
            signupError={signupError}
            signupLoading={signupLoading}
            onSignupSubmit={handleSignup}
          />
        ) : authMode === "signup" && isPlaybookFlow ? (
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
            loginHref={loginHref}
          />
        ) : (
          <GeneralAuthFlow
            authMode={authMode}
            loginHref={loginHref}
            signupHref={signupHref}
            loginEmail={loginEmail}
            onLoginEmailChange={setLoginEmail}
            loginPassword={loginPassword}
            onLoginPasswordChange={setLoginPassword}
            loginError={loginError}
            loginLoading={loginLoading}
            onLoginSubmit={handleLogin}
            signupName={signupName}
            onSignupNameChange={setSignupName}
            signupEmail={signupEmail}
            onSignupEmailChange={setSignupEmail}
            signupPassword={signupPassword}
            onSignupPasswordChange={setSignupPassword}
            signupError={signupError}
            signupLoading={signupLoading}
            onSignupSubmit={handleSignup}
          />
        )}
      </section>
    </div>
  );
}
