import "server-only";

import nodemailer from "nodemailer";
import {
  buildEmailButton,
  buildEmailFooterText,
  buildMemberEmailHtml,
  EMAIL_REPLY_TO,
  escapeHtml,
  getPublicAppUrl,
} from "@/lib/email-layout";
import { LEGAL_PAGE_PATHS } from "@/lib/legal-shared";
import { buildParentConsentConfirmUrl } from "@/lib/parent-consent-token";

function createTransporter() {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!notificationEmail || !emailPassword) {
    throw new Error("NOTIFICATION_EMAIL and EMAIL_PASSWORD are required for parent consent emails.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: notificationEmail,
      pass: emailPassword,
    },
  });
}

function getPlayerFirstName(name: string | null | undefined, email: string) {
  const source = (name ?? email).trim();
  const first = source.split(/\s+/)[0] ?? source;
  return first || "Player";
}

function buildLegalLinksHtml() {
  const appUrl = getPublicAppUrl();
  const links = [
    { label: "Terms of Service", href: `${appUrl}${LEGAL_PAGE_PATHS.terms}` },
    { label: "Privacy Policy", href: `${appUrl}${LEGAL_PAGE_PATHS.privacy}` },
    { label: "Waiver", href: `${appUrl}${LEGAL_PAGE_PATHS.waiver}` },
  ];

  return links
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" style="color:#2D6A4F; text-decoration:underline;">${escapeHtml(link.label)}</a>`,
    )
    .join(", ");
}

function buildLegalLinksText() {
  const appUrl = getPublicAppUrl();
  return [
    `Terms: ${appUrl}${LEGAL_PAGE_PATHS.terms}`,
    `Privacy: ${appUrl}${LEGAL_PAGE_PATHS.privacy}`,
    `Waiver: ${appUrl}${LEGAL_PAGE_PATHS.waiver}`,
  ].join("\n");
}

function formatAgreementDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function buildParentConsentConfirmEmail(params: {
  userId: string;
  playerName: string | null;
  playerEmail: string;
  agreedByName: string;
  agreedAt: Date;
  isReminder?: boolean;
}) {
  const playerFirstName = getPlayerFirstName(params.playerName, params.playerEmail);
  const subject = `Please confirm ${playerFirstName}'s LCB Training agreement`;
  const confirmUrl = buildParentConsentConfirmUrl(params.userId);
  const dateLabel = formatAgreementDate(params.agreedAt);

  const intro = params.isReminder
    ? `This is a friendly reminder to confirm ${playerFirstName}'s LCB Training agreement.`
    : `${escapeHtml(params.agreedByName)} agreed to LCB Training on behalf of ${escapeHtml(playerFirstName)}.`;

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">Please confirm ${escapeHtml(playerFirstName)}&apos;s agreement</h1>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${intro}</p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;"><strong>Player:</strong> ${escapeHtml(params.playerName?.trim() || params.playerEmail)}</p>
      <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;"><strong>Agreed by:</strong> ${escapeHtml(params.agreedByName)}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;"><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0A1628;">Review the ${buildLegalLinksHtml()}.</p>
      ${buildEmailButton("Yes, I agreed", confirmUrl)}
      <p style="margin:20px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6B7280;">Didn&apos;t do this? Reply to this email and I will take care of it.</p>`;

  const text = `Please confirm ${playerFirstName}'s LCB Training agreement

Player: ${params.playerName?.trim() || params.playerEmail}
Agreed by: ${params.agreedByName}
Date: ${dateLabel}

${buildLegalLinksText()}

Confirm: ${confirmUrl}

Didn't do this? Reply to this email and I will take care of it.

${buildEmailFooterText()}`;

  return {
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  };
}

export async function sendParentConsentConfirmEmail(params: {
  to: string;
  userId: string;
  playerName: string | null;
  playerEmail: string;
  agreedByName: string;
  agreedAt: Date;
  isReminder?: boolean;
}) {
  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for parent consent emails.");
  }

  const email = buildParentConsentConfirmEmail(params);
  const transporter = createTransporter();

  await transporter.sendMail({
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

  const playerFirstName = getPlayerFirstName(params.playerName, params.to);
  const subject = "You're all set. Let's get to work.";
  const appUrl = getPublicAppUrl();
  const todayUrl = `${appUrl}/dashboard/today`;

  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">You&apos;re all set</h1>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">Hi ${escapeHtml(playerFirstName)}, your parent confirmed your LCB Training agreement. Let&apos;s get to work.</p>
      ${buildEmailButton("Open Today", todayUrl)}`;

  const text = `You're all set. Let's get to work.

Hi ${playerFirstName}, your parent confirmed your LCB Training agreement.

Open Today: ${todayUrl}

${buildEmailFooterText()}`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"LCB Training" <${fromEmail}>`,
    to: params.to,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
  });
}
