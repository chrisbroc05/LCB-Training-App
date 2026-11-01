import "server-only";

import { sendNotificationEmail } from "@/lib/email-delivery-server";
import { EMAIL_REPLY_TO } from "@/lib/email-layout";
import {
  buildParentConsentConfirmEmail,
  type ParentConsentEmailAudience,
} from "@/lib/parent-consent-email-shared";
import { buildEmailButton, buildMemberEmailHtml, escapeHtml, getPublicAppUrl } from "@/lib/email-layout";

export type { ParentConsentEmailAudience } from "@/lib/parent-consent-email-shared";
export { buildParentConsentConfirmEmail } from "@/lib/parent-consent-email-shared";

export async function sendParentConsentConfirmEmail(params: {
  to: string;
  userId: string;
  playerName: string | null;
  playerEmail: string;
  agreedByName: string;
  agreedAt: Date;
  isReminder?: boolean;
  audience?: ParentConsentEmailAudience;
}) {
  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for parent consent emails.");
  }

  const email = buildParentConsentConfirmEmail(params);
  await sendNotificationEmail({
    from: `"LCB Training" <${fromEmail}>`,
    to: params.to,
    replyTo: EMAIL_REPLY_TO,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendPlayerParentConfirmedEmail(params: {
  to: string;
  playerName: string | null;
}) {
  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for parent-confirmed emails.");
  }

  const playerFirstName = (params.playerName ?? params.to).trim().split(/\s+/)[0] || "Player";
  const subject = "You're all set. Let's get to work.";
  const appUrl = getPublicAppUrl();
  const todayUrl = `${appUrl}/dashboard/today`;

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">You&apos;re all set</h1>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(playerFirstName)}, your parent confirmed your LCB Training agreement. Let&apos;s get to work.</p>
      ${buildEmailButton("Open Today", todayUrl)}`;

  const text = `You're all set. Let's get to work.

Hi ${playerFirstName}, your parent confirmed your LCB Training agreement.

Open Today: ${todayUrl}`;

  await sendNotificationEmail({
    from: `"LCB Training" <${fromEmail}>`,
    to: params.to,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  });
}
