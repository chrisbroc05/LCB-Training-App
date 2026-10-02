"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isLegalPublicPath } from "@/lib/legal-shared";

type Under13LockStatus = {
  needsAcceptance?: boolean;
  needsUnder13ParentLock?: boolean;
  parentConsentEmail?: string | null;
  parentConsentResendsRemaining?: number;
};

export default function Under13ParentConsentGate() {
  const pathname = usePathname();
  const [status, setStatus] = useState<Under13LockStatus | null>(null);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState<"resend" | "update" | null>(null);

  const loadStatus = async () => {
    const response = await fetch("/api/legal/status");
    const data = (await response.json().catch(() => ({}))) as Under13LockStatus;
    setStatus(data);
    if (data.parentConsentEmail) {
      setParentEmail(data.parentConsentEmail);
    }
    return data;
  };

  useEffect(() => {
    if (isLegalPublicPath(pathname)) {
      setStatus({ needsUnder13ParentLock: false });
      return;
    }

    let cancelled = false;

    void loadStatus().then((data) => {
      if (cancelled) {
        return;
      }

      if (!data.needsUnder13ParentLock) {
        setShowEmailEditor(false);
      }
    });

    const intervalId = window.setInterval(() => {
      void loadStatus().then((data) => {
        if (!data.needsUnder13ParentLock && data.needsUnder13ParentLock != null) {
          window.location.reload();
        }
      });
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pathname]);

  if (!status?.needsUnder13ParentLock || isLegalPublicPath(pathname) || status.needsAcceptance) {
    return null;
  }

  const resendsRemaining = status.parentConsentResendsRemaining ?? 0;
  const displayEmail = status.parentConsentEmail ?? "your parent";

  const handleResend = async () => {
    setError("");
    setMessage("");
    setLoadingAction("resend");

    const response = await fetch("/api/legal/parent-consent/resend", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      resendsRemaining?: number;
    };

    setLoadingAction(null);

    if (!response.ok) {
      setError(data.error ?? "Unable to resend email.");
      return;
    }

    setMessage("Email sent.");
    setStatus((current) => ({
      ...current,
      parentConsentResendsRemaining: data.resendsRemaining ?? current?.parentConsentResendsRemaining,
    }));
  };

  const handleUpdateEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoadingAction("update");

    const response = await fetch("/api/legal/parent-consent/update-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentConsentEmail: parentEmail }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      parentConsentEmail?: string;
      resendsRemaining?: number;
    };

    setLoadingAction(null);

    if (!response.ok) {
      setError(data.error ?? "Unable to update email.");
      return;
    }

    setShowEmailEditor(false);
    setMessage("Updated and sent a new confirmation email.");
    setStatus((current) => ({
      ...current,
      parentConsentEmail: data.parentConsentEmail ?? parentEmail.trim().toLowerCase(),
      parentConsentResendsRemaining: data.resendsRemaining ?? current?.parentConsentResendsRemaining,
    }));
  };

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-[#02060f]/95 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border border-[#18243a] bg-[#0b1324] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Almost there!</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          We sent an email to{" "}
          <span className="font-semibold text-zinc-200">{displayEmail}</span> so your parent can
          confirm. Once they tap &quot;Yes, I agreed&quot; you&apos;re all set.
        </p>

        {message ? <p className="mt-3 text-sm text-[#52B788]">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        {showEmailEditor ? (
          <form className="mt-5 space-y-3" onSubmit={(event) => void handleUpdateEmail(event)}>
            <label className="block">
              <span className="text-sm text-zinc-300">Parent or guardian email</span>
              <input
                type="email"
                value={parentEmail}
                onChange={(event) => setParentEmail(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                required
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loadingAction === "update"}
                className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:opacity-60"
              >
                {loadingAction === "update" ? "Saving..." : "Save and resend"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailEditor(false);
                  setParentEmail(status.parentConsentEmail ?? "");
                  setError("");
                }}
                className="rounded-full border border-[#2b3650] px-5 py-2.5 text-sm font-semibold text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={loadingAction === "resend" || resendsRemaining <= 0}
              className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:opacity-60"
            >
              {loadingAction === "resend" ? "Sending..." : "Resend email"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEmailEditor(true);
                setError("");
                setMessage("");
              }}
              className="rounded-full border border-[#2b3650] px-5 py-2.5 text-sm font-semibold text-zinc-300"
            >
              Wrong email? Update it
            </button>
          </div>
        )}

        {!showEmailEditor && resendsRemaining <= 0 ? (
          <p className="mt-3 text-xs text-zinc-500">
            Resend limit reached for today. Try again tomorrow or update the email.
          </p>
        ) : null}
      </div>
    </div>
  );
}
