"use client";

import { useState } from "react";

type PurchaseLinkRecoveryFormProps = {
  resourceSlug: string;
  apiPath: string;
  submitLabel?: string;
  confirmationMessage: string;
};

export default function PurchaseLinkRecoveryForm({
  resourceSlug,
  apiPath,
  submitLabel = "Email my link",
  confirmationMessage,
}: PurchaseLinkRecoveryFormProps) {
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
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), resourceSlug }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setMessage(data.message ?? confirmationMessage);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="purchase-recovery-email" className="sr-only">
          Email
        </label>
        <input
          id="purchase-recovery-email"
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
        {busy ? "Sending..." : submitLabel}
      </button>
      {message ? (
        <p className="text-sm font-medium text-[#52B788]" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
