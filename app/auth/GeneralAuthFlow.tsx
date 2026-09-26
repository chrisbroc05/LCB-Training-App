"use client";

import Link from "next/link";

type GeneralAuthFlowProps = {
  authMode: "login" | "signup";
  loginHref: string;
  signupHref: string;
  loginEmail: string;
  onLoginEmailChange: (value: string) => void;
  loginPassword: string;
  onLoginPasswordChange: (value: string) => void;
  loginError: string;
  loginLoading: boolean;
  onLoginSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  signupName: string;
  onSignupNameChange: (value: string) => void;
  signupEmail: string;
  onSignupEmailChange: (value: string) => void;
  signupPassword: string;
  onSignupPasswordChange: (value: string) => void;
  signupError: string;
  signupLoading: boolean;
  onSignupSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function GeneralAuthFlow({
  authMode,
  loginHref,
  signupHref,
  loginEmail,
  onLoginEmailChange,
  loginPassword,
  onLoginPasswordChange,
  loginError,
  loginLoading,
  onLoginSubmit,
  signupName,
  onSignupNameChange,
  signupEmail,
  onSignupEmailChange,
  signupPassword,
  onSignupPasswordChange,
  signupError,
  signupLoading,
  onSignupSubmit,
}: GeneralAuthFlowProps) {
  if (authMode === "login") {
    return (
      <article className="mx-auto w-full max-w-md rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Welcome back.</h1>
        </header>

        <form className="mt-6 space-y-4" onSubmit={onLoginSubmit}>
          <label className="block">
            <span className="text-sm text-zinc-300">Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={loginEmail}
              onChange={(event) => onLoginEmailChange(event.target.value)}
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
              onChange={(event) => onLoginPasswordChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
              required
            />
          </label>
          {loginError ? <p className="text-sm text-red-300">{loginError}</p> : null}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-full bg-[#22c55e] px-5 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loginLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-center text-sm">
          <a
            href="mailto:chrisbroc05@gmail.com?subject=LCB%20Training%20Password%20Help"
            className="text-zinc-300 underline-offset-2 transition hover:text-[#98b144] hover:underline"
          >
            Forgot password?
          </a>
          <p className="text-zinc-300">
            Don&apos;t have an account?{" "}
            <Link href={signupHref} className="underline-offset-2 transition hover:text-[#98b144] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="mx-auto w-full max-w-md rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Create your account.</h1>
        <p className="mt-3 text-sm font-medium text-[#98b144] sm:text-base">Work Hard. Be Memorable.</p>
        <p className="mt-3 text-sm text-zinc-400 sm:text-base">
          Get your free swing analysis, access your dashboard, and see every breakdown I send you.
        </p>
      </header>

      <form className="mt-6 space-y-4" onSubmit={onSignupSubmit}>
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
        {signupError ? <p className="text-sm text-red-300">{signupError}</p> : null}
        <button
          type="submit"
          disabled={signupLoading}
          className="w-full rounded-full bg-[#22c55e] px-5 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {signupLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-300">
        Already have an account?{" "}
        <Link href={loginHref} className="underline-offset-2 transition hover:text-[#98b144] hover:underline">
          Log in
        </Link>
      </p>
    </article>
  );
}
