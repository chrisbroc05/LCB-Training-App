import "server-only";

import { sendNotificationEmail } from "@/lib/email-delivery-server";
import {
  buildEmailSectionLabel,
  buildMemberEmailHtml,
  EMAIL_REPLY_TO,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import { formatLongDate } from "@/lib/format-date";
import { LEGAL_PAGE_PATHS } from "@/lib/legal-shared";
import { formatWaiverPlayerNameList } from "@/lib/waiver-sign-shared";

export async function sendWaiverConfirmationEmail(params: {
  to: string;
  playerNames: string[];
  signedAt: Date;
  version: string;
}) {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (!notificationEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for waiver emails.");
  }

  const appUrl = getPublicAppUrl();
  const playerListLabel = formatWaiverPlayerNameList(params.playerNames);
  const signedDateLabel = formatLongDate(params.signedAt);
  const title = "Waiver signed for LCB Training";
  const playerSummary =
    params.playerNames.length === 1
      ? `the waiver for <strong>${escapeHtml(params.playerNames[0])}</strong>`
      : `waivers for <strong>${escapeHtml(playerListLabel)}</strong>`;

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">You're all set</h1>
      <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">This confirms that ${playerSummary} were signed on ${escapeHtml(signedDateLabel)}.</p>
      <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Document version: ${escapeHtml(params.version)}</p>
      ${buildEmailSectionLabel("YOUR SIGNED DOCUMENTS")}
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><a href="${escapeHtml(`${appUrl}${LEGAL_PAGE_PATHS.terms}`)}" style="color:#2D6A4F;">Terms of Service</a></p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><a href="${escapeHtml(`${appUrl}${LEGAL_PAGE_PATHS.privacy}`)}" style="color:#2D6A4F;">Privacy Policy</a></p>
      <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><a href="${escapeHtml(`${appUrl}${LEGAL_PAGE_PATHS.waiver}`)}" style="color:#2D6A4F;">Waiver</a></p>
      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">See you at training.</p>`;

  const text = `You're all set

This confirms that ${params.playerNames.length === 1 ? `the waiver for ${params.playerNames[0]}` : `waivers for ${playerListLabel}`} were signed on ${signedDateLabel}.
Document version: ${params.version}

Terms of Service: ${appUrl}${LEGAL_PAGE_PATHS.terms}
Privacy Policy: ${appUrl}${LEGAL_PAGE_PATHS.privacy}
Waiver: ${appUrl}${LEGAL_PAGE_PATHS.waiver}

See you at training.`;

  await sendNotificationEmail({
    from: `"LCB Training" <${notificationEmail}>`,
    to: params.to,
    replyTo: EMAIL_REPLY_TO,
    subject: title,
    text,
    html: buildMemberEmailHtml({ title, bodyContentHtml }),
  });
}
