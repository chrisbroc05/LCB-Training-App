import "server-only";

import { sendNotificationEmail } from "@/lib/email-delivery-server";
import {
  buildEmailButton,
  buildMemberEmailHtml,
  EMAIL_REPLY_TO,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";

export function buildWaiverSignUrl(teamName?: string | null) {
  const base = `${getPublicAppUrl()}/sign`;
  const trimmed = teamName?.trim();
  if (!trimmed) {
    return base;
  }
  return `${base}?team=${encodeURIComponent(trimmed)}`;
}

export async function sendWaiverResignLinkEmail(params: {
  toEmail: string;
  signerName: string;
  playerName: string;
  teamName?: string | null;
}) {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (!notificationEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for waiver emails.");
  }

  const signUrl = buildWaiverSignUrl(params.teamName);
  const subject = `Please re-sign the LCB Training waiver for ${params.playerName}`;
  const teamLine = params.teamName?.trim()
    ? `<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Team: <strong>${escapeHtml(params.teamName.trim())}</strong></p>`
    : "";

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Updated waiver link</h1>
      <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(params.signerName)},</p>
      <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Please review and sign the current LCB Training waiver for <strong>${escapeHtml(params.playerName)}</strong>. This takes about two minutes.</p>
      ${teamLine}
      ${buildEmailButton("Sign waiver", signUrl)}
      <p style="margin:16px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#6B7280;">If the button does not work, copy this link: ${escapeHtml(signUrl)}</p>`;

  const text = `Hi ${params.signerName},

Please sign the current LCB Training waiver for ${params.playerName}.
${params.teamName?.trim() ? `Team: ${params.teamName.trim()}\n` : ""}
Sign here: ${signUrl}`;

  await sendNotificationEmail({
    from: `"LCB Training" <${notificationEmail}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    text,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
  });
}
