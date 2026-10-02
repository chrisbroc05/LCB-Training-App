"use client";

import Link from "next/link";
import SignupWizard from "@/components/SignupWizard";
import type { SignupRequestPayload } from "@/lib/signup-shared";

type ProgramSignupFlowProps = {
  loginHref: string;
  signupError: string;
  signupLoading: boolean;
  onSignup: (payload: SignupRequestPayload) => void | Promise<void>;
};

export default function ProgramSignupFlow({
  loginHref,
  signupError,
  signupLoading,
  onSignup,
}: ProgramSignupFlowProps) {
  return (
    <article className="mx-auto w-full max-w-md rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
      <SignupWizard
        title="Start your 12 weeks."
        subtitle="Create your account, then checkout. Your program starts the day you pick."
        submitLabel="Create account and continue"
        loading={signupLoading}
        error={signupError}
        loginHref={loginHref}
        onSubmit={onSignup}
      />
      <p className="mt-5 text-center text-sm text-zinc-300">
        Already have an account?{" "}
        <Link href={loginHref} className="underline-offset-2 transition hover:text-[#98b144] hover:underline">
          Log in
        </Link>
      </p>
    </article>
  );
}
