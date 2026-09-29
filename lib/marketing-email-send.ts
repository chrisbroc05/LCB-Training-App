import "server-only";

import type { MarketingEmailType } from "@prisma/client";
import nodemailer from "nodemailer";
import { EMAIL_REPLY_TO } from "@/lib/email-layout";
import {
  buildMarketingEmailContent,
  type FollowupSubmissionContext,
  type MarketingEmailRecipient,
} from "@/lib/marketing-email-templates";
import type { MarketingEmailTypeValue } from "@/lib/marketing-email-shared";
import { prisma } from "@/lib/prisma";

function createTransporter() {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!notificationEmail || !emailPassword) {
    throw new Error("NOTIFICATION_EMAIL and EMAIL_PASSWORD are required for marketing emails.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: notificationEmail,
      pass: emailPassword,
    },
  });
}

export function buildMarketingEmailDedupeKey(params: {
  userId: string;
  type: MarketingEmailTypeValue;
  anchorId?: string;
}) {
  if (params.anchorId) {
    return `${params.userId}:${params.type}:${params.anchorId}`;
  }

  return `${params.userId}:${params.type}`;
}

export async function hasMarketingEmailBeenSent(params: {
  userId: string;
  type: MarketingEmailTypeValue;
  anchorId?: string;
}) {
  const dedupeKey = buildMarketingEmailDedupeKey(params);
  const existing = await prisma.marketingEmailLog.findUnique({
    where: { dedupeKey },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function sendMarketingEmail(params: {
  recipient: MarketingEmailRecipient;
  type: MarketingEmailTypeValue;
  submission?: FollowupSubmissionContext;
  skipLog?: boolean;
  subjectPrefix?: string;
}) {
  const content = buildMarketingEmailContent(params.type, params.recipient, params.submission);
  const subject = params.subjectPrefix
    ? `${params.subjectPrefix}${content.subject}`
    : content.subject;
  const transporter = createTransporter();
  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for marketing emails.");
  }

  await transporter.sendMail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: params.recipient.email,
    replyTo: EMAIL_REPLY_TO,
    subject,
    html: content.html,
    text: content.text,
  });

  if (!params.skipLog) {
    const dedupeKey = buildMarketingEmailDedupeKey({
      userId: params.recipient.userId,
      type: params.type,
      anchorId: params.submission?.submissionId,
    });

    await prisma.marketingEmailLog.create({
      data: {
        userId: params.recipient.userId,
        type: params.type as MarketingEmailType,
        dedupeKey,
        anchorSubmissionId: params.submission?.submissionId ?? null,
      },
    });
  }

  return subject;
}
