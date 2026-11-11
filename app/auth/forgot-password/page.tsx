"use client";

import Link from "next/link";
import { useState } from "react";
import { PASSWORD_RESET_GENERIC_MESSAGE } from "@/lib/password-shared";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Couldn't send a reset link right now.");
        return;
      }
      setMessage(data.message ?? PASSWORD_RESET_GENERIC_MESSAGE);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <article className="w-full rounded-2xl border border-[#18243a] bg-black/25 p-5 sm:p-7">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Forgot password</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter the email on your account. We&apos;ll send a reset link if it matches an account.
          </p>
        </header>

        {message ? (
          <p className="mt-6 rounded-xl border border-[#52B788]/40 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#9df3bd]">
            {message}
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm text-zinc-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
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
              {busy ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-zinc-300">
          <Link href="/auth" className="underline-offset-2 transition hover:text-[#98b144] hover:underline">
            Back to log in
          </Link>
        </p>
      </article>
    </div>
  );
}
