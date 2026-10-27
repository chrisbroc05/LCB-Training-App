"use client";

import { useState } from "react";

type Props = {
  userId: string;
  subscription: {
    level: string;
    status: string;
    pastDueGraceEndsAt: string | null;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
  } | null;
};

export default function DevSubscriptionTestingPanel({ userId, subscription }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: "simulate_payment_failed" | "expire_grace") => {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/dev/subscription-testing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId }),
    });
    setBusy(false);
    const data = (await response.json().catch(() => ({}))) as { error?: string; pastDueGraceEndsAt?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Request failed.");
      return;
    }
    setMessage(action === "simulate_payment_failed" ? `PAST_DUE until ${data.pastDueGraceEndsAt ?? "?"}` : "Grace expired; reload the app.");
    window.location.reload();
  };

  if (!subscription) {
    return (
      <p className="mt-6 text-sm text-amber-200">
        No MembershipSubscription on your admin account. Subscribe via /upgrade first (use 4242), with{" "}
        <code className="text-zinc-300">stripe listen</code> running.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-6 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
      <div className="text-sm text-zinc-300">
        <p>
          Level: {subscription.level} | Status: {subscription.status}
        </p>
        {subscription.pastDueGraceEndsAt ? (
          <p className="mt-1">Grace ends: {subscription.pastDueGraceEndsAt}</p>
        ) : null}
        <p className="mt-2 font-mono text-xs text-zinc-500">
          {subscription.stripeCustomerId} / {subscription.stripeSubscriptionId}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("simulate_payment_failed")}
          className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Simulate failed renewal (PAST_DUE + 7d grace)
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("expire_grace")}
          className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788] disabled:opacity-50"
        >
          Expire grace now (drop access)
        </button>
      </div>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
