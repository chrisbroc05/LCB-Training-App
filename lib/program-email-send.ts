import "server-only";

import { sendNotificationEmail } from "@/lib/email-delivery-server";
import type { ProgramEmailRecipient, ProgramEmailType } from "@prisma/client";
import { EMAIL_REPLY_TO } from "@/lib/email-layout";
import { prisma } from "@/lib/prisma";

export function buildEmailDedupeKey(params: {
  enrollmentId: string | null;
  recipient: ProgramEmailRecipient;
  type: ProgramEmailType;
  dateKey: string;
}) {
  const enrollmentPart = params.enrollmentId ?? "coach";
  return `${enrollmentPart}:${params.recipient}:${params.type}:${params.dateKey}`;
}

export async function hasProgramEmailBeenSent(params: {
  enrollmentId: string | null;
  recipient: ProgramEmailRecipient;
  type: ProgramEmailType;
  dateKey: string;
}) {
  const dedupeKey = buildEmailDedupeKey(params);
  const existing = await prisma.emailLog.findUnique({
    where: { dedupeKey },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function sendProgramEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  enrollmentId?: string | null;
  recipient: ProgramEmailRecipient;
  type: ProgramEmailType;
  dateKey: string;
  skipLog?: boolean;
}) {
  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for program emails.");
  }

  await sendNotificationEmail({
    from: `"LCB Training" <${fromEmail}>`,
    to: params.to,
    replyTo: EMAIL_REPLY_TO,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (!params.skipLog) {
    const dedupeKey = buildEmailDedupeKey({
      enrollmentId: params.enrollmentId ?? null,
      recipient: params.recipient,
      type: params.type,
      dateKey: params.dateKey,
    });

    await prisma.emailLog.create({
      data: {
        enrollmentId: params.enrollmentId ?? null,
        recipient: params.recipient,
        type: params.type,
        dateKey: params.dateKey,
        dedupeKey,
      },
    });
  }
}
