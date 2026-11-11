"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useMemo, useState } from "react";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_UPDATED_MESSAGE,
} from "@/lib/password-shared";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        email?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Couldn't reset your password.");
        return;
      }

      setSuccess(data.message ?? PASSWORD_UPDATED_MESSAGE);

      if (data.email) {
        const signInResult = await signIn("credentials", {
          email: data.email,
          password,
          redirect: false,
        });
        if (signInResult?.ok) {
          router.replace("/dashboard?passwordUpdated=1");
          router.refresh();
          return;
        }
      }

      router.replace(`/auth?passwordUpdated=1`);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <article className="w-full rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
        <h1 className="text-2xl font-semibold text-zinc-100">Reset password</h1>
        <p className="mt-3 text-sm text-red-300">This reset link is invalid or has expired.</p>
        <p className="mt-5 text-sm text-zinc-300">
          <Link href="/auth/forgot-password" className="text-[#52B788]">
            Request a new reset link
          </Link>
        </p>
      </article>
    );
  }

  return (
    <article className="w-full rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Choose a new password</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Use at least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </header>

      {success ? (
        <p className="mt-6 rounded-xl border border-[#52B788]/40 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#9df3bd]">
          {success}
        </p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm text-zinc-300">New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-300">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#22c55e] px-5 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </article>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <Suspense
        fallback={
          <article className="w-full rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
            <p className="text-sm text-zinc-400">Loading...</p>
          </article>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
