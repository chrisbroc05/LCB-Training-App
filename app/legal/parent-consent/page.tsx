"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ParentConsentConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/legal/parent-consent/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Unable to confirm the agreement.");
      return;
    }

    setStatus("done");
    setMessage("Thank you. Your confirmation is saved.");
  };

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="rounded-3xl border border-[#0A1628]/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#0A1628]">Confirm the agreement</h1>
        <p className="mt-3 text-sm leading-6 text-[#6B7280]">
          If you agreed to LCB Training on behalf of your player, tap the button below to confirm.
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
            onClick={() => void handleConfirm()}
            disabled={!token || status === "loading"}
            className="mt-6 rounded-2xl bg-[#2D6A4F] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {status === "loading" ? "Saving..." : "Yes, I agreed"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ParentConsentConfirmPage() {
  return (
    <Suspense fallback={<div className="px-4 py-8 text-center text-sm text-zinc-500">Loading...</div>}>
      <ParentConsentConfirmContent />
    </Suspense>
  );
}
