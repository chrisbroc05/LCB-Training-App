"use client";

import { useState } from "react";
import { adminFetchJson } from "@/lib/admin-fetch-shared";
import {
  formatOrgTeamPickNudgeSkipReason,
  type OrgTeamPickNudgeChannel,
  type OrgTeamPickNudgeSkipReason,
} from "@/lib/org-team-pick-nudge-shared";
import { formatOrgMemberNoTeamStatus } from "@/lib/org-team-pick-shared";

type OrgMember = {
  id: string;
  email: string;
  name: string;
  signupDate?: string | Date | null;
  orgJoinedAt?: string | Date | null;
  orgTeamId: string | null;
  orgTeamName: string | null;
  orgTeamNotListedAt?: string | Date | null;
  orgTeamPickNudgeSentAt?: string | Date | null;
};

type NudgeRecipient = {
  userId: string;
  email: string;
  name: string;
  hasPush: boolean;
  channel: OrgTeamPickNudgeChannel;
};

type NudgeSkipped = {
  userId: string;
  email: string;
  name: string;
  reason: OrgTeamPickNudgeSkipReason;
  nudgedAt: string | null;
};

type NudgeSentLog = {
  userId: string;
  email: string;
  name: string;
  sentAt: string;
};

type NudgePreview = {
  organizationId: string;
  organizationName: string;
  hasActiveTeams: boolean;
  recipients: NudgeRecipient[];
  skipped: NudgeSkipped[];
  previouslySent: NudgeSentLog[];
};

type NudgeSendResult = {
  sent: Array<{
    userId: string;
    email: string;
    name: string;
    channel: OrgTeamPickNudgeChannel;
    sentAt: string;
  }>;
  errors: Array<{ userId: string; email: string; error: string }>;
};

type OrgNoTeamMembersPanelProps = {
  organizationId: string;
};

function formatSignupDate(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrgNoTeamMembersPanel({ organizationId }: OrgNoTeamMembersPanelProps) {
  const [members, setMembers] = useState<OrgMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<NudgePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<NudgeSendResult | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  async function loadMembers() {
    setLoading(true);
    setError(null);
    const responseResult = await adminFetchJson<{ members?: OrgMember[]; error?: string }>(
      `/api/admin/organizations/${organizationId}/members`,
    );
    if (!responseResult.ok) {
      setError(responseResult.userMessage);
      setLoading(false);
      return;
    }
    setMembers(responseResult.data.members ?? []);
    setLoading(false);
  }

  async function loadNudgePreview() {
    setPreviewLoading(true);
    setError(null);
    setConfirmOpen(false);
    setSendResult(null);
    setResultMessage(null);
    const responseResult = await adminFetchJson<{ preview?: NudgePreview; error?: string }>(
      `/api/admin/organizations/${organizationId}/team-pick-nudge`,
      { cache: "no-store" },
      {
        context: "org-team-pick-nudge-preview",
        okUserMessage: "Couldn't load team reminder preview.",
      },
    );
    setPreviewLoading(false);
    if (!responseResult.ok) {
      setError(responseResult.userMessage);
      return;
    }
    setPreview(responseResult.data.preview ?? null);
  }

  async function sendNudge() {
    setSending(true);
    setError(null);
    setResultMessage(null);
    const responseResult = await adminFetchJson<{
      preview?: NudgePreview;
      result?: NudgeSendResult;
      message?: string;
      error?: string;
    }>(
      `/api/admin/organizations/${organizationId}/team-pick-nudge`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      },
      {
        context: "org-team-pick-nudge-send",
        okUserMessage: "Couldn't send team reminders.",
      },
    );
    setSending(false);
    setConfirmOpen(false);

    if (!responseResult.ok) {
      setError(responseResult.userMessage);
      return;
    }

    if (responseResult.data.preview) {
      setPreview(responseResult.data.preview);
    }
    setSendResult(responseResult.data.result ?? null);
    setResultMessage(responseResult.data.message ?? "Reminders sent.");
    void loadMembers();
  }

  const noTeamMembers = (members ?? []).filter((member) => !member.orgTeamId);
  const recipientCount = preview?.recipients.length ?? 0;

  return (
    <div className="mt-5 border-t border-[#2b3650] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-200">No team picked</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadMembers()}
            className="rounded-full border border-[#2b3650] px-3 py-1 text-xs font-semibold text-zinc-200"
          >
            {loading ? "Loading..." : members ? "Refresh" : "Load list"}
          </button>
          <button
            type="button"
            onClick={() => void loadNudgePreview()}
            disabled={previewLoading || sending}
            className="rounded-full border border-[#2b3650] bg-[#132033] px-3 py-1 text-xs font-semibold text-zinc-100 disabled:opacity-50"
          >
            {previewLoading ? "Loading preview..." : "Send team reminder"}
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Members with no team selected (includes &quot;My team isn&apos;t listed&quot;). Reminder is
        once per member: push if available, otherwise email.
      </p>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {resultMessage ? <p className="mt-2 text-xs text-[#52B788]">{resultMessage}</p> : null}

      {preview ? (
        <div className="mt-4 space-y-4 rounded-xl border border-[#2b3650] bg-[#0b1324]/80 p-4">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Team reminder preview</p>
            <p className="mt-1 text-xs text-zinc-500">
              {preview.hasActiveTeams
                ? `${recipientCount} would get it now. Already nudged stay skipped.`
                : "This organization has no active teams, so reminders are unavailable."}
            </p>
          </div>

          {recipientCount > 0 ? (
            <div className="overflow-x-auto">
              <p className="mb-1 text-xs font-semibold text-zinc-400">Would send</p>
              <table className="min-w-full text-left text-xs text-zinc-300">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="py-1 pr-3 font-semibold">Name</th>
                    <th className="py-1 pr-3 font-semibold">Email</th>
                    <th className="py-1 font-semibold">Channel</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.recipients.map((row) => (
                    <tr key={row.userId} className="border-t border-[#1e2d45]">
                      <td className="py-2 pr-3 text-zinc-100">{row.name}</td>
                      <td className="py-2 pr-3">{row.email}</td>
                      <td className="py-2">{row.channel === "push" ? "Push" : "Email"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">No eligible members to remind right now.</p>
          )}

          {preview.skipped.length > 0 ? (
            <div className="overflow-x-auto">
              <p className="mb-1 text-xs font-semibold text-zinc-400">Skipped</p>
              <table className="min-w-full text-left text-xs text-zinc-300">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="py-1 pr-3 font-semibold">Name</th>
                    <th className="py-1 pr-3 font-semibold">Email</th>
                    <th className="py-1 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.skipped.map((row) => (
                    <tr key={`skip-${row.userId}-${row.reason}`} className="border-t border-[#1e2d45]">
                      <td className="py-2 pr-3 text-zinc-100">{row.name}</td>
                      <td className="py-2 pr-3">{row.email}</td>
                      <td className="py-2">
                        {formatOrgTeamPickNudgeSkipReason(row.reason)}
                        {row.nudgedAt ? ` (${formatDateTime(row.nudgedAt)})` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {preview.previouslySent.length > 0 ? (
            <div className="overflow-x-auto">
              <p className="mb-1 text-xs font-semibold text-zinc-400">Already sent (log)</p>
              <table className="min-w-full text-left text-xs text-zinc-300">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="py-1 pr-3 font-semibold">Name</th>
                    <th className="py-1 pr-3 font-semibold">Email</th>
                    <th className="py-1 font-semibold">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.previouslySent.map((row) => (
                    <tr key={`sent-${row.userId}`} className="border-t border-[#1e2d45]">
                      <td className="py-2 pr-3 text-zinc-100">{row.name}</td>
                      <td className="py-2 pr-3">{row.email}</td>
                      <td className="py-2">{formatDateTime(row.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {sendResult && sendResult.sent.length > 0 ? (
            <div className="overflow-x-auto">
              <p className="mb-1 text-xs font-semibold text-[#52B788]">Just sent</p>
              <table className="min-w-full text-left text-xs text-zinc-300">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="py-1 pr-3 font-semibold">Name</th>
                    <th className="py-1 pr-3 font-semibold">Email</th>
                    <th className="py-1 pr-3 font-semibold">Channel</th>
                    <th className="py-1 font-semibold">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {sendResult.sent.map((row) => (
                    <tr key={`just-${row.userId}`} className="border-t border-[#1e2d45]">
                      <td className="py-2 pr-3 text-zinc-100">{row.name}</td>
                      <td className="py-2 pr-3">{row.email}</td>
                      <td className="py-2 pr-3">{row.channel === "push" ? "Push" : "Email"}</td>
                      <td className="py-2">{formatDateTime(row.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {sendResult && sendResult.errors.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-red-300">Errors</p>
              {sendResult.errors.map((row) => (
                <p key={`err-${row.userId}`} className="text-xs text-red-300">
                  {row.email}: {row.error}
                </p>
              ))}
            </div>
          ) : null}

          {preview.hasActiveTeams && recipientCount > 0 ? (
            !confirmOpen ? (
              <button
                type="button"
                disabled={sending}
                onClick={() => setConfirmOpen(true)}
                className="rounded-full bg-[#2D6A4F] px-4 py-2 text-xs font-semibold text-[#F4F6F8] disabled:opacity-50"
              >
                Send to {recipientCount}
              </button>
            ) : (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="text-xs text-zinc-200">
                  Send team reminder to {recipientCount} member
                  {recipientCount === 1 ? "" : "s"}? Each person only gets this once.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void sendNudge()}
                    className="rounded-full bg-[#2D6A4F] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Confirm send"}
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => setConfirmOpen(false)}
                    className="rounded-full border border-[#2b3650] px-4 py-2 text-xs text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {members ? (
        noTeamMembers.length === 0 ? (
          <p className="mt-3 text-xs text-zinc-400">Everyone has a team picked.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-zinc-300">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-1 pr-3 font-semibold">Name</th>
                  <th className="py-1 pr-3 font-semibold">Email</th>
                  <th className="py-1 pr-3 font-semibold">Signup</th>
                  <th className="py-1 pr-3 font-semibold">Status</th>
                  <th className="py-1 font-semibold">Reminded</th>
                </tr>
              </thead>
              <tbody>
                {noTeamMembers.map((member) => {
                  const status = formatOrgMemberNoTeamStatus(member);
                  return (
                    <tr key={member.id} className="border-t border-[#1e2d45]">
                      <td className="py-2 pr-3 text-zinc-100">{member.name}</td>
                      <td className="py-2 pr-3">{member.email}</td>
                      <td className="py-2 pr-3">
                        {formatSignupDate(member.orgJoinedAt ?? member.signupDate)}
                      </td>
                      <td className="py-2 pr-3">
                        {status === "not_listed" ? "Not listed" : "Not picked"}
                      </td>
                      <td className="py-2">{formatDateTime(member.orgTeamPickNudgeSentAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}
