"use client";

import { useState } from "react";

type UpgradeActionsProps = {
  tier: "BASIC" | "PRO";
};

export default function UpgradeActions({ tier }: UpgradeActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipTier: tier }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Unable to start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Unable to start checkout right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={startCheckout}
        disabled={isLoading}
        className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Redirecting..." : `Upgrade to ${tier === "BASIC" ? "Basic" : "Pro"}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
