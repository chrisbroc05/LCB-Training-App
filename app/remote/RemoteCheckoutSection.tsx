"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import SignupWizard from "@/components/SignupWizard";
import { postCheckout } from "@/lib/checkout-client";
import { submitSignupRequest } from "@/lib/signup-client";
import type { SignupRequestPayload } from "@/lib/signup-shared";

type RemoteCheckoutSectionProps = {
  isLoggedIn: boolean;
  autoStartCheckout: boolean;
};

const buttonClassName =
  "inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto disabled:cursor-not-allowed disabled:opacity-70";

function RemoteCheckoutSectionContent({
  isLoggedIn,
  autoStartCheckout,
}: RemoteCheckoutSectionProps) {
  const searchParams = useSearchParams();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const startCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const payload = await postCheckout("/api/checkout/remote");
      window.location.href = payload.url!;
    } catch (checkoutError) {
      setCheckoutError(
        checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.",
      );
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (!autoStartCheckout || !isLoggedIn || checkoutLoading) {
      return;
    }

    void startCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartCheckout, isLoggedIn]);

  const handleSignup = async (payload: SignupRequestPayload) => {
    setAuthLoading(true);
    setAuthError("");

    const response = await submitSignupRequest({
      ...payload,
      selectedMembershipTier: "FREE",
      signupSource: "remote_session",
    });

    if (!response.ok) {
      setAuthLoading(false);
      setAuthError(response.error);
      return;
    }

    const loginResult = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    if (!loginResult || loginResult.error) {
      setAuthLoading(false);
      setAuthError("Account created, but auto-login failed. Please log in below.");
      setAuthMode("login");
      return;
    }

    window.location.href = "/remote?startCheckout=1";
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    const loginResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setAuthLoading(false);

    if (!loginResult || loginResult.error) {
      setAuthError("Invalid email or password.");
      return;
    }

    window.location.href = "/remote?startCheckout=1";
  };

  if (isLoggedIn) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => void startCheckout()}
          disabled={checkoutLoading}
          className={buttonClassName}
        >
          {checkoutLoading ? "Redirecting to checkout..." : "Book Remote Session -- $60"}
        </button>
        {checkoutError ? <p className="text-sm text-red-300">{checkoutError}</p> : null}
        {searchParams.get("checkout") === "cancelled" ? (
          <p className="text-sm text-zinc-400">
            Checkout was cancelled. You can try again whenever you are ready.
          </p>
        ) : null}
      </div>
    );
  }

  if (!showAccountForm) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setShowAccountForm(true)} className={buttonClassName}>
          Book Remote Session -- $60
        </button>
        <p className="text-sm text-zinc-400">
          Create your account on the next step, then continue to secure checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#2b3650] bg-black/30 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">
        {authMode === "signup" ? "Create your account" : "Log in to continue"}
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        {authMode === "signup"
          ? "Set up your account first, then you will proceed to secure checkout for your remote session."
          : "Log in to continue to checkout for your remote session."}
      </p>

      {authMode === "signup" ? (
        <div className="mt-5">
          <SignupWizard
            title="Create your account"
            submitLabel="Create Account and Continue"
            loading={authLoading}
            error={authError}
            onSubmit={handleSignup}
          />
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleLogin}>
          <label className="block text-sm text-zinc-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
              placeholder="Your password"
              required
            />
          </label>
          {authError ? <p className="text-sm text-red-300">{authError}</p> : null}
          <button type="submit" disabled={authLoading} className={buttonClassName}>
            {authLoading ? "Logging in..." : "Log In and Continue"}
          </button>
        </form>
      )}

      <p className="mt-4 text-sm text-zinc-400">
        {authMode === "signup" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setAuthError("");
                setAuthMode("login");
              }}
              className="font-semibold text-[#52B788] hover:text-[#9df3bd]"
            >
              Log in
            </button>
          </>
        ) : (
          <>
            Need an account?{" "}
            <button
              type="button"
              onClick={() => {
                setAuthError("");
                setAuthMode("signup");
              }}
              className="font-semibold text-[#52B788] hover:text-[#9df3bd]"
            >
              Create one
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export default function RemoteCheckoutSection(props: RemoteCheckoutSectionProps) {
  return (
    <Suspense fallback={<div className="h-12" />}>
      <RemoteCheckoutSectionContent {...props} />
    </Suspense>
  );
}
