import {
  buildAdminSubmissionUrl,
  type CoachSubmissionTab,
} from "@/lib/coach-push-shared";
import {
  buildAuthRedirectPath,
  buildEmailButton,
  buildEmailSectionLabel,
  buildMemberEmailHtml,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import type { DatabaseTier } from "@/lib/membership";
import { formatDatabaseTierLabel } from "@/lib/membership";
import { getChicagoMondayStart } from "@/lib/program-schedule";
import {
  getSubmissionTypeLabelForEmail,
  type SubmissionVideoCategory,
} from "@/lib/submission-form-shared";

const CHICAGO_TIME_ZONE = "America/Chicago";

export type CoachSubmissionNotificationEmailParams = {
  submissionId: string;
  submissionTab: CoachSubmissionTab;
  firstName: string;
  fullName: string;
  membershipTier: DatabaseTier;
  ageGroupLabel?: string | null;
  programWeekNumber?: number | null;
  whereWasThis?: string | null;
  lookAtFocus?: string | null;
  videoCategory?: SubmissionVideoCategory | null;
  note: string;
  submittedAt: Date;
};

function formatChicagoDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatChicagoDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getCoachSubmissionResponseDueLabel(
  membershipTier: DatabaseTier,
  submittedAt: Date,
) {
  if (membershipTier === "TWELVE_WEEK") {
    const monday = getChicagoMondayStart(submittedAt);
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    return formatChicagoDate(sunday);
  }

  const hours = membershipTier === "ELITE" ? 24 : 48;
  const dueAt = new Date(submittedAt.getTime() + hours * 60 * 60 * 1000);
  return formatChicagoDateTime(dueAt);
}

function buildCoachSubmissionContextLine(params: CoachSubmissionNotificationEmailParams) {
  if (
    params.membershipTier === "TWELVE_WEEK" &&
    params.ageGroupLabel &&
    params.programWeekNumber &&
    params.programWeekNumber > 0
  ) {
    return `${params.ageGroupLabel} - Week ${params.programWeekNumber} of 12`;
  }

  if (params.membershipTier === "FREE") {
    return "Free submission";
  }

  return formatDatabaseTierLabel(params.membershipTier);
}

function buildAdminSubmissionOpenUrl(submissionTab: CoachSubmissionTab, submissionId: string) {
  const adminPath = buildAdminSubmissionUrl(submissionTab, submissionId);
  return `${getPublicAppUrl()}${buildAuthRedirectPath(adminPath)}`;
}

export function buildCoachSubmissionNotificationEmailContent(
  params: CoachSubmissionNotificationEmailParams,
) {
  const submissionTypeLabel = getSubmissionTypeLabelForEmail({
    submissionTab: params.submissionTab,
    videoCategory: params.videoCategory,
  });
  const trimmedFirstName = params.firstName.trim() || params.fullName.trim().split(/\s+/)[0] || "Player";
  const subject = `New video from ${trimmedFirstName}: ${submissionTypeLabel}`;
  const headline = `${params.fullName.trim()} sent a ${submissionTypeLabel} video`;
  const contextLine = buildCoachSubmissionContextLine(params);
  const dueLabel = getCoachSubmissionResponseDueLabel(params.membershipTier, params.submittedAt);
  const adminUrl = buildAdminSubmissionOpenUrl(params.submissionTab, params.submissionId);
  const note = params.note.trim() || "No note provided.";

  const whereSection =
    params.whereWasThis && params.whereWasThis.trim()
      ? `${buildEmailSectionLabel("WHERE")}
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(params.whereWasThis.trim())}</p>`
      : "";

  const lookAtSection =
    params.lookAtFocus && params.lookAtFocus.trim()
      ? `${buildEmailSectionLabel("LOOK AT")}
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(params.lookAtFocus.trim())}</p>`
      : "";

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${escapeHtml(headline)}</h1>
              <p style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#6B7280;">${escapeHtml(contextLine)}</p>
              ${whereSection}
              ${lookAtSection}
              ${buildEmailSectionLabel("THEIR NOTE")}
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628; white-space:pre-wrap;">${escapeHtml(note)}</p>
              ${buildEmailButton("Open in admin", adminUrl)}
              <p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">Respond by ${escapeHtml(dueLabel)}</p>`;

  const whereText =
    params.whereWasThis && params.whereWasThis.trim()
      ? `\n\nWHERE\n${params.whereWasThis.trim()}`
      : "";
  const lookAtText =
    params.lookAtFocus && params.lookAtFocus.trim()
      ? `\n\nLOOK AT\n${params.lookAtFocus.trim()}`
      : "";

  const text = `${headline}

${contextLine}${whereText}${lookAtText}

THEIR NOTE
${note}

Open in admin: ${adminUrl}

Respond by ${dueLabel}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}
