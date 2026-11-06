"use client";

import { useState } from "react";
import { adminFetchJson } from "@/lib/admin-fetch-shared";

type AdminAllAccessCapPanelProps = {
  initialCap: number;
  capUsed: number;
};

export default function AdminAllAccessCapPanel({
  initialCap,
  capUsed,
}: AdminAllAccessCapPanelProps) {
  const [cap, setCap] = useState(String(initialCap));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveCap() {
    setBusy(true);
    setMessage("");
    try {
      const res = await adminFetchJson<{
        error?: string;
        allAccessProgramCap?: number;
      }>(
        "/api/admin/platform-coaching-settings",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allAccessProgramCap: Number(cap) }),
        },
        { context: "admin-all-access-cap", okUserMessage: "Could not save cap." },
      );
      if (!res.ok) {
        setMessage(res.userMessage);
        return;
      }
      const data = res.data;
      if (data.allAccessProgramCap != null) {
        setCap(String(data.allAccessProgramCap));
      }
      setMessage("Saved");
    } catch {
      setMessage("Could not save cap.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
      <h2 className="text-base font-semibold text-zinc-100">All-Access program cap</h2>
      <p className="mt-1 text-sm text-zinc-400">
        In use: {capUsed} (All-Access subscriptions + active 12-Week program players).
      </p>
      <label className="mt-3 block text-xs text-zinc-400">
        Maximum slots
        <input
          type="number"
          min={1}
          value={cap}
          onChange={(event) => setCap(event.target.value)}
          onBlur={() => void saveCap()}
          disabled={busy}
          className="mt-1 w-full max-w-[120px] rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      {message ? (
        <p className={`mt-2 text-xs ${message === "Saved" ? "text-[#9df3bd]" : "text-red-300"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
