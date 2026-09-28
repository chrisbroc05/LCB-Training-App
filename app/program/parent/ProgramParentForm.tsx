"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProgramParentForm() {
  const [secondName, setSecondName] = useState("");
  const [secondEmail, setSecondEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await fetch("/api/program/email-settings");
      const data = (await response.json().catch(() => ({}))) as {
        enrollment?: {
          parentName: string | null;
          parentEmail: string | null;
        };
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Unable to load second email settings.");
        setLoading(false);
        return;
      }

      setSecondName(data.enrollment?.parentName ?? "");
      setSecondEmail(data.enrollment?.parentEmail ?? "");
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/program/email-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentName: secondName.trim() || null,
        parentEmail: secondEmail.trim() || null,
        parentEmailsEnabled: secondEmail.trim() ? true : undefined,
        dismissParentPrompt: true,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to save second email.");
      return;
    }

    setSuccess("Saved.");
  };

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-[#0A1628]/10 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/dashboard/today" className="text-sm font-semibold text-[#2D6A4F]">
          Back to Today
        </Link>

        <div className="mt-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">Add a second email</h1>
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">
              Add a parent email or your own if a parent signed you up. They get weekly recaps and
              a heads up if things slip.
            </p>
          </div>

          {loading ? <p className="text-sm text-[#6B7280]">Loading...</p> : null}

          {!loading ? (
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#0A1628]">Name (optional)</span>
                <input
                  type="text"
                  value={secondName}
                  onChange={(event) => setSecondName(event.target.value)}
                  className="w-full rounded-2xl border border-[#0A1628]/15 px-4 py-3 text-sm text-[#0A1628]"
                  placeholder="Optional"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#0A1628]">Second email (optional)</span>
                <input
                  type="email"
                  value={secondEmail}
                  onChange={(event) => setSecondEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[#0A1628]/15 px-4 py-3 text-sm text-[#0A1628]"
                  placeholder="Optional"
                />
              </label>
            </div>
          ) : null}

          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
          {success ? <p className="text-sm font-medium text-[#2D6A4F]">{success}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="rounded-2xl bg-[#2D6A4F] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <Link
              href="/dashboard/today"
              onClick={() => {
                void fetch("/api/program/email-settings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ dismissParentPrompt: true }),
                });
              }}
              className="inline-flex items-center rounded-2xl border border-[#0A1628]/15 px-6 py-3 text-sm font-semibold text-[#0A1628]"
            >
              Skip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
