"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async () => {
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/marketing/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Unable to unsubscribe.");
      return;
    }

    setStatus("done");
    setMessage("You are unsubscribed from marketing emails.");
  };

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-[#0A1628]/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#0A1628]">Unsubscribe from marketing emails</h1>
        <p className="mt-3 text-sm leading-6 text-[#6B7280]">
          This stops onboarding and follow-up emails from Coach Broc. Program emails for enrolled
          players are not affected. You can turn announcements back on anytime in Settings.
        </p>

        {message ? (
          <p
            className={`mt-4 text-sm font-medium ${status === "error" ? "text-red-700" : "text-[#2D6A4F]"}`}
          >
            {message}
          </p>
        ) : null}

        {status !== "done" ? (
          <button
            type="button"
            onClick={() => void handleUnsubscribe()}
            disabled={!token || status === "loading"}
            className="mt-6 rounded-2xl bg-[#2D6A4F] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {status === "loading" ? "Saving..." : "Unsubscribe"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function MarketingUnsubscribePage() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-sm text-[#6B7280]">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
