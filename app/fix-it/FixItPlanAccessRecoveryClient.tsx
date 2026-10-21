"use client";

import Link from "next/link";
import { useState } from "react";
import type { FixItPlanGenerated } from "@/lib/fix-it-plans-data.generated";

type FixItPlanAccessRecoveryClientProps = {
  plan: FixItPlanGenerated;
};

export default function FixItPlanAccessRecoveryClient({ plan }: FixItPlanAccessRecoveryClientProps) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/fix-it/request-plan-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), resourceSlug: plan.resourceSlug }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setMessage(data.message ?? "If that email has this plan, your link is on the way.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">Fix-It Hitting Plan</p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">{plan.title}</h1>
      <p className="mt-2 text-base text-zinc-400">{plan.subtitle}</p>

      <div className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324]/90 p-6">
        <h2 className="text-lg font-semibold text-white">Already bought this plan?</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          Enter the email you used and we&apos;ll send you your plan link.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fix-it-recovery-email" className="sr-only">
              Email
            </label>
            <input
              id="fix-it-recovery-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#52B788] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#2D6A4F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#52B788] disabled:opacity-60"
          >
            {busy ? "Sending..." : "Email my plan link"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 text-sm font-medium text-[#52B788]" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mt-8 text-center text-sm text-zinc-400">
        Haven&apos;t bought yet?{" "}
        <Link href="/fix-it" className="font-semibold text-[#52B788] underline-offset-2 hover:underline">
          See the Fix-It plans
        </Link>
      </p>
    </div>
  );
}
