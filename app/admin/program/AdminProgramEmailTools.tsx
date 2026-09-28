"use client";

import { useEffect, useState } from "react";

type PlayerOption = {
  enrollmentId: string;
  name: string;
};

type DryRunEmailPreview = {
  channel?: "email";
  type: string;
  recipient: string;
  to: string;
  subject: string;
  enrollmentId: string | null;
};

type DryRunPushPreview = {
  channel: "push";
  type: string;
  userId: string;
  enrollmentId: string;
  title: string;
  body: string;
  url: string;
  dateKey: string;
};

type DryRunPreview = DryRunEmailPreview | DryRunPushPreview;

const EMAIL_TYPES = [
  { value: "DAILY_ROUTINE", label: "A. Daily routine" },
  { value: "DAY_BEFORE_START", label: "B. Day before start" },
  { value: "SATURDAY_VIDEO_REMINDER", label: "C. Saturday video reminder" },
  { value: "GONE_QUIET", label: "D. Gone quiet" },
  { value: "PARENT_SATURDAY_VIDEO", label: "E. Second email Saturday video" },
  { value: "PARENT_GONE_QUIET", label: "F. Second email gone quiet" },
  { value: "PARENT_WEEKLY_RECAP", label: "G. Second email weekly recap" },
  { value: "COACH_DAILY_SUMMARY", label: "Coach summary" },
] as const;

type AdminProgramEmailToolsProps = {
  players: PlayerOption[];
};

function isPushPreview(preview: DryRunPreview): preview is DryRunPushPreview {
  return preview.channel === "push";
}

export default function AdminProgramEmailTools({ players }: AdminProgramEmailToolsProps) {
  const [dryRunResults, setDryRunResults] = useState<DryRunPreview[]>([]);
  const [dryRunMeta, setDryRunMeta] = useState("");
  const [loadingDryRun, setLoadingDryRun] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(players[0]?.enrollmentId ?? "");
  const [testEmail, setTestEmail] = useState("");
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [sendingPushTest, setSendingPushTest] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!selectedEnrollmentId && players[0]?.enrollmentId) {
      setSelectedEnrollmentId(players[0].enrollmentId);
    }
  }, [players, selectedEnrollmentId]);

  const runDryRun = async () => {
    setLoadingDryRun(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/admin/program/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dryRun" }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      previews?: DryRunEmailPreview[];
      pushPreviews?: DryRunPushPreview[];
      dateKey?: string;
      hour?: number;
      error?: string;
    };

    setLoadingDryRun(false);

    if (!response.ok) {
      setError(data.error ?? "Dry run failed.");
      return;
    }

    const combined: DryRunPreview[] = [
      ...(data.previews ?? []),
      ...(data.pushPreviews ?? []),
    ];
    setDryRunResults(combined);
    setDryRunMeta(`Chicago ${data.dateKey ?? ""} hour ${data.hour ?? ""}`);
  };

  const sendTest = async (type: string) => {
    if (!selectedEnrollmentId) {
      setError("Pick a player first.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      setError("Enter a valid test email address.");
      return;
    }

    setSendingType(type);
    setError("");
    setSuccess("");

    const response = await fetch("/api/admin/program/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendTest",
        type,
        enrollmentId: selectedEnrollmentId,
        toEmail: testEmail.trim(),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      subject?: string;
      error?: string;
    };

    setSendingType(null);

    if (!response.ok) {
      setError(data.error ?? "Test send failed.");
      return;
    }

    setSuccess(`Sent test: ${data.subject ?? type}`);
  };

  const sendTestPush = async () => {
    if (!selectedEnrollmentId) {
      setError("Pick a player first.");
      return;
    }

    setSendingPushTest(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/admin/program/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendTestPush",
        enrollmentId: selectedEnrollmentId,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setSendingPushTest(false);

    if (!response.ok) {
      setError(data.error ?? "Test push failed.");
      return;
    }

    setSuccess("Test push sent to the selected player.");
  };

  return (
    <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h2 className="text-xl font-semibold text-zinc-100">Email tools</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Dry run shows what the next hourly cron would send (email and push). Test sends use real
        player data and skip EmailLog/PushLog.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void runDryRun()}
          disabled={loadingDryRun}
          className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788] disabled:opacity-60"
        >
          {loadingDryRun ? "Running..." : "Dry run next send"}
        </button>
        <button
          type="button"
          onClick={() => void sendTestPush()}
          disabled={sendingPushTest}
          className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-60"
        >
          {sendingPushTest ? "Sending..." : "Send test push to player"}
        </button>
      </div>

      {dryRunMeta ? <p className="mt-3 text-xs text-zinc-500">{dryRunMeta}</p> : null}

      {dryRunResults.length > 0 ? (
        <div className="mt-4 space-y-2">
          {dryRunResults.map((preview, index) => (
            <div
              key={`${"channel" in preview ? preview.channel : "email"}-${preview.type}-${index}`}
              className="rounded-xl border border-[#2b3650] px-4 py-3 text-sm text-zinc-300"
            >
              {isPushPreview(preview) ? (
                <>
                  <p>
                    <span className="font-semibold text-[#52B788]">PUSH</span>{" "}
                    <span className="font-semibold text-zinc-100">{preview.type}</span>
                  </p>
                  <p className="text-zinc-400">
                    {preview.title} - {preview.body}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <span className="font-semibold text-zinc-100">{preview.type}</span> to{" "}
                    {preview.to}
                  </p>
                  <p className="text-zinc-400">{preview.subject}</p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-200">Player data source</span>
          <select
            value={selectedEnrollmentId}
            onChange={(event) => setSelectedEnrollmentId(event.target.value)}
            className="w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-4 py-3 text-sm text-zinc-100"
          >
            {players.map((player) => (
              <option key={player.enrollmentId} value={player.enrollmentId}>
                {player.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-200">Send test email to</span>
          <input
            type="email"
            value={testEmail}
            onChange={(event) => setTestEmail(event.target.value)}
            className="w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-4 py-3 text-sm text-zinc-100"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {EMAIL_TYPES.map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => void sendTest(entry.value)}
            disabled={sendingType === entry.value}
            className="rounded-full border border-[#2b3650] px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-60"
          >
            {sendingType === entry.value ? "Sending..." : entry.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-[#52B788]">{success}</p> : null}
    </section>
  );
}
