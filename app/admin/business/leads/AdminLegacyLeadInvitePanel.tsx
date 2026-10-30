"use client";

import { useState } from "react";

type Preview = {
  eligibleCount: number;
  alreadySentCount: number;
  blockedMissingAddress: boolean;
  marketingStartAt: string | null;
  sample: Array<{ email: string; firstName: string; source: string; createdAt: string }>;
};

export default function AdminLegacyLeadInvitePanel() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads/legacy-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview" }),
      });
      const data = (await response.json()) as { preview?: Preview; error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Preview failed.");
        return;
      }
      setPreview(data.preview ?? null);
    } finally {
      setLoading(false);
    }
  };

  const sendBatch = async () => {
    if (!window.confirm("Send the one-time legacy lead invite to eligible leads (max 50 per batch)?")) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads/legacy-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", confirm: true, limit: 50 }),
      });
      const data = (await response.json()) as {
        sent?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };
      if (!response.ok) {
        setMessage(data.error ?? "Send failed.");
        return;
      }
      setMessage(`Sent ${data.sent ?? 0}, skipped ${data.skipped ?? 0}.`);
      if (data.errors?.length) {
        setMessage((prev) => `${prev} Errors: ${data.errors!.join("; ")}`);
      }
      await loadPreview();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
      <h2 className="text-lg font-semibold text-zinc-100">Legacy lead one-time invite</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Automated day-3 lead email only runs for leads created on or after{" "}
        <code className="text-zinc-300">MARKETING_EMAILS_START_AT</code>. Use this to preview and
        manually send the legacy one-time invite to older leads (deduped per lead).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPreview()}
          className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788] disabled:opacity-50"
        >
          Preview eligible leads
        </button>
        <button
          type="button"
          disabled={loading || !preview || preview.eligibleCount === 0 || preview.blockedMissingAddress}
          onClick={() => void sendBatch()}
          className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Send batch (50 max)
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
      {preview ? (
        <div className="mt-4 text-sm text-zinc-400">
          <p>
            Eligible: {preview.eligibleCount} | Already sent legacy invite: {preview.alreadySentCount}
          </p>
          {preview.blockedMissingAddress ? (
            <p className="mt-2 text-yellow-200">COMPANY_MAILING_ADDRESS is not set on this server.</p>
          ) : null}
          {preview.marketingStartAt ? (
            <p className="mt-1">Marketing start: {preview.marketingStartAt}</p>
          ) : (
            <p className="mt-2 text-yellow-200">MARKETING_EMAILS_START_AT is not set.</p>
          )}
          {preview.sample.length > 0 ? (
            <ul className="mt-3 max-h-40 overflow-auto text-xs text-zinc-500">
              {preview.sample.map((row) => (
                <li key={row.email}>
                  {row.email} ({row.source}) - {row.createdAt.slice(0, 10)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
