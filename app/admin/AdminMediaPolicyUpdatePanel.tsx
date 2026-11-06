"use client";
import { adminFetchJson } from "@/lib/admin-fetch-shared";

import { useEffect, useState } from "react";

type PreviewState = {
  recipientCount: number;
  subject: string;
  sampleText: string;
};

export default function AdminMediaPolicyUpdatePanel() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const loadPreview = async () => {
    setLoading(true);
    setError("");
    const responseResult = await adminFetchJson("/api/admin/media-policy-update", { cache: "no-store" });
    setLoading(false);
    if (!responseResult.ok) {
      setError("Unable to load media update email preview.");
      return;
    }
    const data = (responseResult.data) as PreviewState;
    setPreview(data);
  };

  useEffect(() => {
    void loadPreview();
  }, []);

  const send = async () => {
    setSending(true);
    setError("");
    setResultMessage("");
    const res = await adminFetchJson<{ error?: string; sent?: number }>(
      "/api/admin/media-policy-update",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      },
      { context: "admin-media-policy-send", okUserMessage: "Send failed." },
    );
    setSending(false);
    setConfirmOpen(false);

    if (!res.ok) {
      setError(res.userMessage);
      return;
    }

    setResultMessage(`Sent ${res.data.sent ?? 0} email(s).`);
    void loadPreview();
  };

  return (
    <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Send media update email</h2>
      <p className="mt-2 text-sm text-zinc-400">
        One-time email to families who chose &ldquo;No&rdquo; on media consent (not already sent,
        not marked keep out of all footage). Nothing sends automatically.
      </p>

      {loading ? <p className="mt-4 text-sm text-zinc-400">Loading preview...</p> : null}

      {preview ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-zinc-100">Recipients ready:</span>{" "}
            {preview.recipientCount}
          </p>
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-zinc-100">Subject:</span> {preview.subject}
          </p>
          <pre className="max-h-64 overflow-auto rounded-xl border border-[#2b3650] bg-black/40 p-4 text-xs leading-relaxed whitespace-pre-wrap text-zinc-300">
            {preview.sampleText}
          </pre>
          {!confirmOpen ? (
            <button
              type="button"
              disabled={preview.recipientCount === 0 || sending}
              onClick={() => setConfirmOpen(true)}
              className="rounded-full bg-[#2D6A4F] px-5 py-2.5 text-sm font-semibold text-[#F4F6F8] disabled:opacity-50"
            >
              Send media update email
            </button>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-sm text-zinc-200">
                Send to {preview.recipientCount} recipient{preview.recipientCount === 1 ? "" : "s"}?
                Each address only gets this once.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void send()}
                  className="rounded-full bg-[#2D6A4F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Confirm send
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-full border border-[#2b3650] px-4 py-2 text-sm text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {resultMessage ? <p className="mt-3 text-sm text-[#52B788]">{resultMessage}</p> : null}
    </section>
  );
}
