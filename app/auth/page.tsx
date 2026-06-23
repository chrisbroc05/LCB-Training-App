"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { keyToDatabaseTier, membershipTiers, type TierKey } from "@/lib/membership";
import type { DatabaseTier } from "@/lib/membership";

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

  const tierQueryParam = searchParams.get("tier");
  const normalizedTierQuery = tierQueryParam?.toLowerCase();
  const preselectedTierFromQuery = membershipTiers.find(
    (tier) => tier.key === normalizedTierQuery,
  )?.key;
  const selectedTier: TierKey = manuallySelectedTier ?? preselectedTierFromQuery ?? "free";
  const selectedTierDetails = membershipTiers.find((tier) => tier.key === selectedTier);
  const selectedDatabaseTier: DatabaseTier = keyToDatabaseTier[selectedTier];
  const checkoutStatus = searchParams.get("checkout");

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    setLoginLoading(false);

    if (!result || result.error) {
      setLoginError("Invalid email or password.");
      return;
    }

    window.location.href = result.url ?? "/dashboard";
  };

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
      window.location.href = "/dashboard";
      return;
    }

    const checkoutResponse = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ membershipTier: selectedDatabaseTier }),
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-7">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Choose Your Membership Plan</h1>
        <p className="mt-2 max-w-3xl text-zinc-300">
          New members can start free with one swing analysis or mental game submission, then
          upgrade anytime for more access.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-4">
          {membershipTiers.map((tier) => {
            const isSelected = selectedTier === tier.key;

            return (
              <article
                key={tier.key}
                className={`rounded-2xl border p-6 transition ${
                  isSelected
                    ? "border-[#22c55e] bg-[#22c55e]/10"
                    : "border-[#18243a] bg-[#0f1d34]/70"
                }`}
              >
                <div className="flex flex-col items-start gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <h2 className="text-xl font-semibold text-zinc-100">{tier.name}</h2>
                  {isSelected && (
                    <span className="rounded-full bg-[#22c55e]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
                      Selected
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold text-[#98b144]">{tier.priceLabel}</p>
                <p className="mt-3 text-sm text-zinc-300">{tier.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-200">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#22c55e]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setManuallySelectedTier(tier.key)}
                  className={`mt-6 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-[#22c55e] text-black"
                      : "border border-[#2b3650] text-zinc-100 hover:border-[#7f9434] hover:text-[#98b144]"
                  }`}
                >
                  {isSelected ? "Plan Selected" : `Choose ${tier.name}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {checkoutStatus === "cancelled" && (
        <section className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
          Checkout was cancelled. Your account is ready, and you can choose a plan again any time.
        </section>
      )}

      <section className="mt-6 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Member Login</h2>
          <p className="mt-2 text-zinc-300">
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
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Create Account</h2>
          <p className="mt-2 text-zinc-300">
            Join LCB Training and start improving your game this week.
          </p>
          <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/80 p-4 text-sm">
            <p className="text-zinc-300">Selected plan</p>
            <p className="mt-1 font-semibold text-[#98b144]">
              {selectedTierDetails
                ? `${selectedTierDetails.name} (${selectedTierDetails.priceLabel})`
                : "No plan selected yet"}
            </p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleSignup}>
            <label className="block">
              <span className="text-sm text-zinc-300">Full Name</span>
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
        </article>
      </section>
    </div>
  );
}
