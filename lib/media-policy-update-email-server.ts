import "server-only";

import { sendNotificationEmail } from "@/lib/email-delivery-server";
import { EMAIL_REPLY_TO } from "@/lib/email-layout";
import { isMinorPlayerAge } from "@/lib/legal-shared";
import {
  buildMediaPolicyUpdateEmail,
  mediaPolicyUpdateDedupeKey,
} from "@/lib/media-policy-update-email-shared";
import { prisma } from "@/lib/prisma";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function firstNameFromFullName(name: string | null | undefined, fallbackEmail: string) {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0] ?? trimmed;
  }
  const local = fallbackEmail.split("@")[0] ?? "there";
  return local || "there";
}

export type MediaPolicyUpdateRecipient = {
  email: string;
  firstName: string;
  source: "user" | "waiver";
};

export async function listMediaPolicyUpdateRecipients(): Promise<MediaPolicyUpdateRecipient[]> {
  const [users, waivers, sentLogs] = await Promise.all([
    prisma.user.findMany({
      where: {
        isTestAccount: false,
        mediaConsent: false,
        mediaOptOutAll: false,
      },
      select: {
        email: true,
        accountRole: true,
        accountHolderName: true,
        playerFirstName: true,
        parentConsentEmail: true,
        playerAge: true,
        name: true,
      },
    }),
    prisma.waiverSignature.findMany({
      where: {
        mediaConsent: false,
        mediaOptOutAll: false,
      },
      select: {
        signerEmail: true,
        signerFullName: true,
        playerFirstName: true,
        playerAge: true,
      },
    }),
    prisma.mediaPolicyUpdateEmailLog.findMany({
      select: { email: true },
    }),
  ]);

  const alreadySent = new Set(sentLogs.map((row) => normalizeEmail(row.email)));
  const byEmail = new Map<string, MediaPolicyUpdateRecipient>();

  for (const user of users) {
    let toEmail = user.email;
    if (isMinorPlayerAge(user.playerAge) && user.parentConsentEmail?.trim()) {
      toEmail = user.parentConsentEmail.trim();
    }
    const normalized = normalizeEmail(toEmail);
    if (alreadySent.has(normalized)) {
      continue;
    }
    const firstName =
      user.accountRole === "PARENT"
        ? firstNameFromFullName(user.accountHolderName, normalized)
        : firstNameFromFullName(user.playerFirstName ?? user.name, normalized);
    byEmail.set(normalized, { email: normalized, firstName, source: "user" });
  }

  for (const waiver of waivers) {
    const normalized = normalizeEmail(waiver.signerEmail);
    if (alreadySent.has(normalized)) {
      continue;
    }
    if (!byEmail.has(normalized)) {
      byEmail.set(normalized, {
        email: normalized,
        firstName: firstNameFromFullName(waiver.signerFullName, normalized),
        source: "waiver",
      });
    }
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function sendMediaPolicyUpdateEmails(params: { dryRun?: boolean } = {}) {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (!notificationEmail) {
    throw new Error("NOTIFICATION_EMAIL is required.");
  }

  const recipients = await listMediaPolicyUpdateRecipients();
  if (params.dryRun) {
    return { sent: 0, skipped: recipients.length, recipients };
  }

  let sent = 0;
  for (const recipient of recipients) {
    const dedupeKey = mediaPolicyUpdateDedupeKey(recipient.email);
    const existing = await prisma.mediaPolicyUpdateEmailLog.findUnique({
      where: { dedupeKey },
      select: { id: true },
    });
    if (existing) {
      continue;
    }

    const email = buildMediaPolicyUpdateEmail({ recipientFirstName: recipient.firstName });
    await sendNotificationEmail({
      from: `"Coach Broc" <${notificationEmail}>`,
      to: recipient.email,
      replyTo: EMAIL_REPLY_TO,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    await prisma.mediaPolicyUpdateEmailLog.create({
      data: {
        email: recipient.email,
        dedupeKey,
      },
    });
    sent += 1;
  }

  return { sent, skipped: recipients.length - sent, recipients };
}
