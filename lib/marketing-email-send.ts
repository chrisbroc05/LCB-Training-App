import "server-only";

import type { MarketingEmailType } from "@prisma/client";
import { sendNotificationEmail } from "@/lib/email-delivery-server";
import { EMAIL_REPLY_TO } from "@/lib/email-layout";
import {
  buildMarketingEmailContent,
  type FollowupSubmissionContext,
  type MarketingEmailRecipient,
} from "@/lib/marketing-email-templates";
import type { MarketingEmailTypeValue } from "@/lib/marketing-email-shared";
import { assertCompanyMailingAddressForMarketing } from "@/lib/marketing-email-guard-server";
import { resolveUserMarketingDeliveryEmail } from "@/lib/marketing-recipient-server";
import { prisma } from "@/lib/prisma";

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
  assertCompanyMailingAddressForMarketing();

  const delivery = await resolveUserMarketingDeliveryEmail(params.recipient.userId);
  if (delivery.skipped) {
    return null;
  }

  const content = buildMarketingEmailContent(params.type, params.recipient, params.submission);
  const subject = params.subjectPrefix
    ? `${params.subjectPrefix}${content.subject}`
    : content.subject;
  const fromEmail = process.env.NOTIFICATION_EMAIL;
  if (!fromEmail) {
    throw new Error("NOTIFICATION_EMAIL is required for marketing emails.");
  }

  await sendNotificationEmail({
    from: `"Coach Broc | LCB Training" <${fromEmail}>`,
    to: delivery.toEmail,
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

export type SendMarketingEmailResult = string | null;
