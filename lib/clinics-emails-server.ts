import "server-only";

import { sendNotificationEmail } from "@/lib/email-delivery-server";
import {
  buildEmailButton,
  buildMemberEmailHtml,
  EMAIL_REPLY_TO,
  escapeHtml,
} from "@/lib/email-layout";
import {
  formatClinicMoney,
  formatClinicTimeRange,
} from "@/lib/clinics-shared";

function requireFromEmail() {
  const fromEmail = process.env.NOTIFICATION_EMAIL?.trim();
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for clinic emails.");
  }
  return fromEmail;
}

export async function sendClinicRegistrationConfirmationEmail(params: {
  toEmail: string;
  parentName: string;
  clinicName: string;
  dayLabels: string[];
  startTimeLocal: string;
  endTimeLocal: string;
  location: string;
  whatToBring: string;
  refundPolicyText: string;
  setPasswordUrl: string | null;
}) {
  const greeting = params.parentName.trim()
    ? `Hi ${escapeHtml(params.parentName.trim().split(/\s+/)[0] || params.parentName.trim())},`
    : "Hi,";
  const daysLine = params.dayLabels.map((label) => escapeHtml(label)).join(", ");
  const timeLine = escapeHtml(
    formatClinicTimeRange(params.startTimeLocal, params.endTimeLocal),
  );
  const subject = `You're registered: ${params.clinicName}`;

  const passwordBlock = params.setPasswordUrl
    ? `<p style="margin:16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Set your app password (link valid 7 days):</p>
      ${buildEmailButton("Set your password", params.setPasswordUrl)}`
    : "";

  const bodyContentHtml = `<p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${greeting}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">You're signed up for <strong>${escapeHtml(params.clinicName)}</strong>.</p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong>Days:</strong> ${daysLine}</p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong>Time:</strong> ${timeLine}</p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong>Location:</strong> ${escapeHtml(params.location)}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong>What to bring:</strong> ${escapeHtml(params.whatToBring)}</p>
      ${passwordBlock}
      <p style="margin:16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Your free swing breakdown and daily challenges are waiting in the app.</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Your Terms and Waiver acceptance is on file for this clinic.</p>
      <p style="margin:0 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;"><strong>Refund policy:</strong> ${escapeHtml(params.refundPolicyText)}</p>`;

  const text = `${params.parentName.trim() ? `Hi ${params.parentName.trim().split(/\s+/)[0]},` : "Hi,"}

You're signed up for ${params.clinicName}.

Days: ${params.dayLabels.join(", ")}
Time: ${formatClinicTimeRange(params.startTimeLocal, params.endTimeLocal)}
Location: ${params.location}
What to bring: ${params.whatToBring}
${params.setPasswordUrl ? `\nSet your password (valid 7 days): ${params.setPasswordUrl}\n` : ""}
Your free swing breakdown and daily challenges are waiting in the app.

Your Terms and Waiver acceptance is on file for this clinic.
Refund policy: ${params.refundPolicyText}`;

  await sendNotificationEmail({
    from: `"LCB Training" <${requireFromEmail()}>`,
    to: params.toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  });
}

export async function sendClinicCoachPaidRegistrationEmail(params: {
  clinicName: string;
  playerName: string;
  playerAge: number;
  dayLabels: string[];
  amountCents: number;
  parentName: string;
  parentEmail: string;
}) {
  const toEmail = process.env.NOTIFICATION_EMAIL?.trim();
  if (!toEmail) {
    return;
  }

  const subject = `Clinic signup: ${params.playerName} - ${params.clinicName}`;
  const body = `New paid clinic registration

Clinic: ${params.clinicName}
Player: ${params.playerName} (age ${params.playerAge})
Days: ${params.dayLabels.join(", ")}
Amount: ${formatClinicMoney(params.amountCents)}
Parent: ${params.parentName} <${params.parentEmail}>`;

  await sendNotificationEmail({
    from: `"LCB Training" <${toEmail}>`,
    to: toEmail,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({
      title: subject,
      bodyContentHtml: `<pre style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#0A1628;">${escapeHtml(body)}</pre>`,
    }),
    text: body,
  });
}
