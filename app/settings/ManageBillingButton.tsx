"use client";

import { useState } from "react";

export default function ManageBillingButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleClick = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const response = await fetch("/api/stripe/billing-portal", {
      method: "POST",
    });

    setIsLoading(false);

    const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string };

    if (!response.ok || !data.url) {
      setErrorMessage(data.error ?? "Unable to open billing portal right now.");
      return;
    }

    window.location.href = data.url;
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isLoading}
        className="rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Opening..." : "Manage Billing"}
      </button>
      {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
    </div>
  );
}
