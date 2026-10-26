import {
  buildAdminCoachingReportsUrl,
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
import {
  formatLongDate,
  formatLongDateTime,
} from "@/lib/format-date";
import type { DatabaseTier } from "@/lib/membership";
import { getChicagoMondayStart } from "@/lib/program-schedule";
import {
  getSubmissionTypeLabelForEmail,
  type SubmissionVideoCategory,
} from "@/lib/submission-form-shared";

export type CoachSubmissionNotificationKind = "VIDEO_REVIEW" | "WRITTEN_REPORT";

export type CoachSubmissionNotificationEmailParams = {
  submissionId: string;
  submissionTab: CoachSubmissionTab;
  notificationKind?: CoachSubmissionNotificationKind;
  effectivePlanLabel?: string | null;
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

export function getCoachSubmissionResponseDueLabel(
  membershipTier: DatabaseTier,
  submittedAt: Date,
) {
  if (membershipTier === "TWELVE_WEEK") {
    const monday = getChicagoMondayStart(submittedAt);
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    return formatLongDate(sunday);
  }

  const hours = membershipTier === "ELITE" ? 24 : 48;
  const dueAt = new Date(submittedAt.getTime() + hours * 60 * 60 * 1000);
  return formatLongDateTime(dueAt);
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
    return params.notificationKind === "WRITTEN_REPORT"
      ? "Free - written report"
      : "Free submission";
  }

  const planLabel = params.effectivePlanLabel?.trim();
  if (planLabel) {
    return planLabel;
  }

  return "Member submission";
}

function buildAdminSubmissionOpenUrl(params: CoachSubmissionNotificationEmailParams) {
  const adminPath =
    params.notificationKind === "WRITTEN_REPORT"
      ? buildAdminCoachingReportsUrl(params.submissionId, "pending")
      : buildAdminSubmissionUrl(params.submissionTab, params.submissionId);
  return `${getPublicAppUrl()}${buildAuthRedirectPath(adminPath)}`;
}

export function buildCoachSubmissionNotificationEmailContent(
  params: CoachSubmissionNotificationEmailParams,
) {
  const isWrittenReport = params.notificationKind === "WRITTEN_REPORT";
  const submissionTypeLabel = getSubmissionTypeLabelForEmail({
    submissionTab: params.submissionTab,
    videoCategory: params.videoCategory,
  });
  const trimmedFirstName = params.firstName.trim() || params.fullName.trim().split(/\s+/)[0] || "Player";
  const subject = isWrittenReport
    ? `Swing report requested: ${trimmedFirstName}`
    : `New video from ${trimmedFirstName}: ${submissionTypeLabel}`;
  const headline = isWrittenReport
    ? `${params.fullName.trim()} requested a written swing report`
    : `${params.fullName.trim()} sent a ${submissionTypeLabel} video`;
  const contextLine = buildCoachSubmissionContextLine(params);
  const dueLabel = getCoachSubmissionResponseDueLabel(params.membershipTier, params.submittedAt);
  const adminUrl = buildAdminSubmissionOpenUrl(params);
  const note = params.note.trim() || "No note provided.";
  const footerLine = isWrittenReport
    ? "Report requested"
    : `Respond by ${dueLabel}`;

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
              <p style="margin:24px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">${escapeHtml(footerLine)}</p>`;

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

${footerLine}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}
