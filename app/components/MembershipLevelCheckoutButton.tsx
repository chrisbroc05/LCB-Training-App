"use client";

import { useState } from "react";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipLevelLabel } from "@/lib/membership-levels-shared";

type Props = {
  level: MembershipLevelKey;
  label?: string;
  className?: string;
  showOrgCode?: boolean;
  capFullWaitlist?: boolean;
};

export default function MembershipLevelCheckoutButton({
  level,
  label,
  className = "",
  showOrgCode = false,
  capFullWaitlist = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [orgJoinCode, setOrgJoinCode] = useState("");
  const [message, setMessage] = useState("");
  const [waitlistMode, setWaitlistMode] = useState(capFullWaitlist);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistNote, setWaitlistNote] = useState("");

  const startCheckout = async () => {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/stripe/checkout/membership-level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        orgJoinCode: orgJoinCode.trim() || undefined,
      }),
    });
    setBusy(false);
    const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string; code?: string };
    if (data.code === "ALL_ACCESS_CAP_FULL") {
      setWaitlistMode(true);
      setMessage(data.error ?? "All-Access is full. Join the waitlist.");
      return;
    }
    if (!response.ok || !data.url) {
      setMessage(data.error ?? "Could not start checkout.");
      return;
    }
    window.location.href = data.url;
  };

  const submitWaitlist = async () => {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/membership/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: waitlistName,
        email: waitlistEmail,
        note: waitlistNote,
      }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error ?? "Could not join waitlist.");
      return;
    }
    setMessage("You are on the All-Access waitlist. Coach Broc will reach out when a spot opens.");
  };

  if (waitlistMode) {
    return (
      <div className={className}>
        <p className="mb-3 text-sm text-zinc-300">All-Access program spots are full. Join the waitlist.</p>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Your name"
            value={waitlistName}
            onChange={(e) => setWaitlistName(e.target.value)}
            className="w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm text-zinc-100"
          />
          <input
            type="email"
            placeholder="Email"
            value={waitlistEmail}
            onChange={(e) => setWaitlistEmail(e.target.value)}
            className="w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm text-zinc-100"
          />
          <textarea
            placeholder="Note (optional)"
            value={waitlistNote}
            onChange={(e) => setWaitlistNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm text-zinc-100"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitWaitlist()}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {busy ? "Sending..." : "Join the waitlist"}
          </button>
        </div>
        {message ? <p className="mt-2 text-sm text-zinc-300">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className={className}>
      {showOrgCode ? (
        <label className="mb-2 block text-xs text-zinc-400">
          Club code (optional)
          <input
            type="text"
            value={orgJoinCode}
            onChange={(e) => setOrgJoinCode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm text-zinc-100"
            autoComplete="off"
          />
        </label>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void startCheckout()}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:opacity-60"
      >
        {busy ? "Loading..." : label ?? `Choose ${formatMembershipLevelLabel(level)}`}
      </button>
      {message ? <p className="mt-2 text-sm text-amber-200">{message}</p> : null}
    </div>
  );
}
