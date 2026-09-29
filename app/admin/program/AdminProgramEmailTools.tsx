"use client";

import { useEffect, useState } from "react";
import { MARKETING_EMAIL_LABELS, MARKETING_EMAIL_TYPES } from "@/lib/marketing-email-shared";
import { formatScheduleWindow, PROGRAM_SCHEDULE_WINDOWS } from "@/lib/program-schedule-windows";

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

type DryRunCoachPushPreview = {
  channel: "coach-push";
  type: string;
  title: string;
  body: string;
  url: string;
  dateKey: string;
};

type DryRunMarketingEmailPreview = {
  channel: "marketing-email";
  type: string;
  userId: string;
  firstName: string;
  to: string;
  subject: string;
  anchorSubmissionId: string | null;
  anchorDate: string;
  ageDays: number;
  window: string;
};

type DryRunPreview =
  | DryRunEmailPreview
  | DryRunPushPreview
  | DryRunCoachPushPreview
  | DryRunMarketingEmailPreview;

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

const COACH_ALERT_TYPES = [
  { value: "COACH_NEW_SUBMISSION_SWING", label: "Coach: new swing video" },
  { value: "COACH_NEW_SUBMISSION_MENTAL", label: "Coach: new mental video" },
  { value: "COACH_NEW_PROGRAM_PLAYER", label: "Coach: new program player" },
  { value: "COACH_NIGHTLY_SUMMARY", label: "Coach: nightly summary" },
  { value: "COACH_NEW_MESSAGE", label: "Coach: new player message" },
] as const;

const MESSAGE_TEST_TYPES = [
  { value: "COACH_REPLY_PUSH", label: "Player: Coach Broc replied push" },
  { value: "COACH_REPLY_EMAIL", label: "Player: Coach Broc replied email" },
] as const;

const COACH_EMAIL_TYPES = [
  { value: "COACH_NEW_SUBMISSION_SWING", label: "Coach: new swing email" },
  { value: "COACH_NEW_SUBMISSION_MENTAL", label: "Coach: new mental email" },
] as const;

type AdminProgramEmailToolsProps = {
  players: PlayerOption[];
};

function isPushPreview(preview: DryRunPreview): preview is DryRunPushPreview {
  return preview.channel === "push";
}

function isCoachPushPreview(preview: DryRunPreview): preview is DryRunCoachPushPreview {
  return preview.channel === "coach-push";
}

function isMarketingEmailPreview(preview: DryRunPreview): preview is DryRunMarketingEmailPreview {
  return preview.channel === "marketing-email";
}

export default function AdminProgramEmailTools({ players }: AdminProgramEmailToolsProps) {
  const [dryRunResults, setDryRunResults] = useState<DryRunPreview[]>([]);
  const [dryRunMeta, setDryRunMeta] = useState("");
  const [loadingDryRun, setLoadingDryRun] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(players[0]?.enrollmentId ?? "");
  const [testEmail, setTestEmail] = useState("");
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [sendingPushTest, setSendingPushTest] = useState(false);
  const [sendingCoachAlertType, setSendingCoachAlertType] = useState<string | null>(null);
  const [sendingCoachEmailType, setSendingCoachEmailType] = useState<string | null>(null);
  const [sendingMarketingType, setSendingMarketingType] = useState<string | null>(null);
  const [sendingMessageTestType, setSendingMessageTestType] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!selectedEnrollmentId && players[0]?.enrollmentId) {
      setSelectedEnrollmentId(players[0].enrollmentId);
    }
  }, [players, selectedEnrollmentId]);

  const selectedPlayer = players.find((player) => player.enrollmentId === selectedEnrollmentId);

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
      coachPushPreviews?: DryRunCoachPushPreview[];
      marketingPreviews?: DryRunMarketingEmailPreview[];
      dateKey?: string;
      hour?: number;
      activeWindows?: string[];
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
      ...(data.coachPushPreviews ?? []),
      ...(data.marketingPreviews ?? []),
    ];
    setDryRunResults(combined);
    const active =
      data.activeWindows && data.activeWindows.length > 0
        ? data.activeWindows.join(", ")
        : "none";
    setDryRunMeta(
      `Chicago ${data.dateKey ?? ""} hour ${data.hour ?? ""} | active windows: ${active}`,
    );
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

  const sendTestCoachAlert = async (coachAlertType: string) => {
    setSendingCoachAlertType(coachAlertType);
    setError("");
    setSuccess("");

    const response = await fetch("/api/admin/program/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendTestCoachAlert",
        coachAlertType,
        enrollmentId: selectedEnrollmentId || undefined,
        playerName: selectedPlayer?.name ?? "Test Player",
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setSendingCoachAlertType(null);

    if (!response.ok) {
      setError(data.error ?? "Test coach alert failed.");
      return;
    }

    setSuccess("Test coach alert sent.");
  };

  const sendTestCoachEmail = async (coachEmailType: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      setError("Enter a valid test email address.");
      return;
    }

    setSendingCoachEmailType(coachEmailType);
    setError("");
    setSuccess("");

    const response = await fetch("/api/admin/program/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendTestCoachEmail",
        coachEmailType,
        enrollmentId: selectedEnrollmentId || undefined,
        toEmail: testEmail.trim(),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      subject?: string;
      error?: string;
    };

    setSendingCoachEmailType(null);

    if (!response.ok) {
      setError(data.error ?? "Test coach email failed.");
      return;
    }

    setSuccess(`Sent test: ${data.subject ?? coachEmailType}`);
  };

  const sendTestMessageNotification = async (messageTestType: string) => {
    setSendingMessageTestType(messageTestType);
    setError("");
    setSuccess("");

    if (messageTestType === "COACH_REPLY_EMAIL") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
        setSendingMessageTestType(null);
        setError("Enter a valid test email address.");
        return;
      }
    }

    if (!selectedEnrollmentId) {
      setSendingMessageTestType(null);
      setError("Pick a player first.");
      return;
    }

    const response = await fetch("/api/admin/program/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendTestMessageNotification",
        messageTestType,
        enrollmentId: selectedEnrollmentId,
        toEmail: testEmail.trim(),
        playerName: selectedPlayer?.name ?? "Test Player",
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      subject?: string;
      error?: string;
    };

    setSendingMessageTestType(null);

    if (!response.ok) {
      setError(data.error ?? "Test message notification failed.");
      return;
    }

    setSuccess(data.subject ? `Sent test: ${data.subject}` : "Test message notification sent.");
  };

  const sendTestMarketing = async (type: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      setError("Enter a valid test email address.");
      return;
    }

    setSendingMarketingType(type);
    setError("");
    setSuccess("");

    const response = await fetch("/api/admin/program/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendTestMarketing",
        type,
        toEmail: testEmail.trim(),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      subject?: string;
      error?: string;
    };

    setSendingMarketingType(null);

    if (!response.ok) {
      setError(data.error ?? "Test marketing send failed.");
      return;
    }

    setSuccess(`Sent test: ${data.subject ?? type}`);
  };

  return (
    <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h2 className="text-xl font-semibold text-zinc-100">Email tools</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Dry run shows what the hourly cron would send right now. Each job uses the first run at or
        after its target hour (Chicago), once per dateKey. Dedupe in EmailLog/PushLog prevents
        repeats. Players get one afternoon push: gone quiet replaces daily work when both apply.
        Direct message pushes send instantly and are not part of this dry run.
        Test sends use real player data and skip EmailLog/PushLog.
      </p>
      <ul className="mt-3 space-y-1 text-xs text-zinc-500">
        {PROGRAM_SCHEDULE_WINDOWS.map((window) => (
          <li key={window.id}>{formatScheduleWindow(window)}</li>
        ))}
      </ul>

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
              {isCoachPushPreview(preview) ? (
                <>
                  <p>
                    <span className="font-semibold text-[#52B788]">COACH PUSH</span>{" "}
                    <span className="font-semibold text-zinc-100">{preview.type}</span>
                  </p>
                  <p className="text-zinc-400">
                    {preview.title} - {preview.body}
                  </p>
                </>
              ) : isMarketingEmailPreview(preview) ? (
                <>
                  <p>
                    <span className="font-semibold text-[#52B788]">MARKETING</span>{" "}
                    <span className="font-semibold text-zinc-100">{preview.type}</span> to{" "}
                    {preview.firstName} ({preview.to})
                  </p>
                  <p className="text-zinc-400">{preview.subject}</p>
                  <p className="text-xs text-zinc-500">
                    Window {preview.window} | age {preview.ageDays} days | anchor{" "}
                    {preview.anchorDate.slice(0, 10)}
                    {preview.anchorSubmissionId
                      ? ` | submission ${preview.anchorSubmissionId}`
                      : ""}
                  </p>
                </>
              ) : isPushPreview(preview) ? (
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

      <div className="mt-6 border-t border-[#2b3650] pt-5">
        <p className="text-sm font-semibold text-zinc-200">Send test marketing email</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MARKETING_EMAIL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => void sendTestMarketing(type)}
              disabled={sendingMarketingType === type}
              className="rounded-full border border-[#2b3650] px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-60"
            >
              {sendingMarketingType === type ? "Sending..." : MARKETING_EMAIL_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-[#2b3650] pt-5">
        <p className="text-sm font-semibold text-zinc-200">Send test coach alert</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COACH_ALERT_TYPES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => void sendTestCoachAlert(entry.value)}
              disabled={sendingCoachAlertType === entry.value}
              className="rounded-full border border-[#52B788]/50 px-3 py-2 text-xs font-semibold text-[#52B788] disabled:opacity-60"
            >
              {sendingCoachAlertType === entry.value ? "Sending..." : entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-[#2b3650] pt-5">
        <p className="text-sm font-semibold text-zinc-200">Send test message notification</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MESSAGE_TEST_TYPES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => void sendTestMessageNotification(entry.value)}
              disabled={sendingMessageTestType === entry.value}
              className="rounded-full border border-[#52B788]/50 px-3 py-2 text-xs font-semibold text-[#52B788] disabled:opacity-60"
            >
              {sendingMessageTestType === entry.value ? "Sending..." : entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-[#2b3650] pt-5">
        <p className="text-sm font-semibold text-zinc-200">Send test coach submission email</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COACH_EMAIL_TYPES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => void sendTestCoachEmail(entry.value)}
              disabled={sendingCoachEmailType === entry.value}
              className="rounded-full border border-[#52B788]/50 px-3 py-2 text-xs font-semibold text-[#52B788] disabled:opacity-60"
            >
              {sendingCoachEmailType === entry.value ? "Sending..." : entry.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-[#52B788]">{success}</p> : null}
    </section>
  );
}
