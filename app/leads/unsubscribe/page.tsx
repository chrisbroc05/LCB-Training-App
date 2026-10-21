"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LeadUnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link.");
      return;
    }
    setStatus("loading");
    const response = await fetch("/api/leads/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Unable to unsubscribe.");
      return;
    }
    setStatus("done");
    setMessage("You are unsubscribed from training tips and offers from Coach Broc.");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-white">Email preferences</h1>
      {status === "done" ? (
        <p className="mt-4 text-zinc-300">{message}</p>
      ) : (
        <>
          <p className="mt-4 text-zinc-300">
            Stop training tips and offers from Coach Broc at this email address.
          </p>
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={status === "loading"}
            className="mt-6 min-h-[48px] rounded-full bg-[#2D6A4F] px-8 py-3 text-sm font-semibold text-white hover:bg-[#52B788] disabled:opacity-60"
          >
            {status === "loading" ? "Working..." : "Unsubscribe"}
          </button>
          {status === "error" ? <p className="mt-4 text-red-400">{message}</p> : null}
        </>
      )}
    </div>
  );
}

export default function LeadUnsubscribePage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-zinc-300">Loading...</p>}>
      <LeadUnsubscribeContent />
    </Suspense>
  );
}
