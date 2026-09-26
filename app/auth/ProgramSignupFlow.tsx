"use client";

import Link from "next/link";

type ProgramSignupFlowProps = {
  loginHref: string;
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

export default function ProgramSignupFlow({
  loginHref,
  signupName,
  onSignupNameChange,
  signupEmail,
  onSignupEmailChange,
  signupPassword,
  onSignupPasswordChange,
  signupError,
  signupLoading,
  onSignupSubmit,
}: ProgramSignupFlowProps) {
  return (
    <article className="mx-auto w-full max-w-md rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Start your 12 weeks.</h1>
        <p className="mt-3 text-sm font-medium text-[#98b144] sm:text-base">Work Hard. Be Memorable.</p>
        <p className="mt-3 text-sm text-zinc-400 sm:text-base">
          Create your account, then checkout. Your program starts the day you pick.
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
          {signupLoading ? "Creating account..." : "Create Account and Continue to Checkout"}
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
