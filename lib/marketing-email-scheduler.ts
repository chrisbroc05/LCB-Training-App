import "server-only";

import {
  formatMarketingEmailWindow,
  getMarketingEmailAgeDays,
  MARKETING_EMAIL_TYPES,
  type MarketingEmailTypeValue,
} from "@/lib/marketing-email-shared";
import {
  getDueFollowupTypes,
  loadFreeSubmissionReminderCandidates,
  loadMarketingFollowupAnchors,
  loadUserMarketingRecipient,
} from "@/lib/marketing-email-data";
import {
  buildMarketingEmailContent,
  buildMarketingTestSubmissionContext,
  type FollowupSubmissionContext,
  type MarketingEmailRecipient,
} from "@/lib/marketing-email-templates";
import {
  hasMarketingEmailBeenSent,
  sendMarketingEmail,
} from "@/lib/marketing-email-send";

export type MarketingEmailPreview = {
  channel: "marketing-email";
  type: MarketingEmailTypeValue;
  userId: string;
  firstName: string;
  to: string;
  subject: string;
  anchorSubmissionId: string | null;
  anchorDate: string;
  ageDays: number;
  window: string;
};

export type MarketingEmailRunResult = {
  dryRun: boolean;
  previews: MarketingEmailPreview[];
  sent: number;
  skipped: number;
  errors: string[];
};

const FOLLOWUP_TYPES = MARKETING_EMAIL_TYPES.filter(
  (type) => type.startsWith("FOLLOWUP_"),
) as MarketingEmailTypeValue[];

async function previewOrSend(params: {
  recipient: MarketingEmailRecipient;
  type: MarketingEmailTypeValue;
  submission?: FollowupSubmissionContext;
  anchorDate: Date;
  dryRun: boolean;
  previews: MarketingEmailPreview[];
}) {
  const alreadySent = await hasMarketingEmailBeenSent({
    userId: params.recipient.userId,
    type: params.type,
    anchorId: params.submission?.submissionId,
  });

  if (alreadySent) {
    return { sent: false, skipped: true };
  }

  const content = buildMarketingEmailContent(
    params.type,
    params.recipient,
    params.submission,
  );

  params.previews.push({
    channel: "marketing-email",
    type: params.type,
    userId: params.recipient.userId,
    firstName: params.recipient.firstName,
    to: params.recipient.email,
    subject: content.subject,
    anchorSubmissionId: params.submission?.submissionId ?? null,
    anchorDate: params.anchorDate.toISOString(),
    ageDays: getMarketingEmailAgeDays(params.anchorDate),
    window: formatMarketingEmailWindow(params.type),
  });

  if (params.dryRun) {
    return { sent: false, skipped: false };
  }

  await sendMarketingEmail({
    recipient: params.recipient,
    type: params.type,
    submission: params.submission,
  });

  return { sent: true, skipped: false };
}

export async function runMarketingEmailScheduler(params?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<MarketingEmailRunResult> {
  const dryRun = params?.dryRun ?? false;
  const now = params?.now ?? new Date();
  const previews: MarketingEmailPreview[] = [];
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  const reminderCandidates = await loadFreeSubmissionReminderCandidates(now);
  for (const candidate of reminderCandidates) {
    try {
      const result = await previewOrSend({
        recipient: candidate,
        type: "FREE_SUBMISSION_REMINDER",
        anchorDate: candidate.signupDate,
        dryRun,
        previews,
      });
      if (result.sent) {
        sent += 1;
      } else if (result.skipped) {
        skipped += 1;
      }
    } catch (error) {
      errors.push(
        `FREE_SUBMISSION_REMINDER for ${candidate.email}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  const followupAnchors = await loadMarketingFollowupAnchors(now);
  for (const anchor of followupAnchors) {
    const dueTypes = getDueFollowupTypes(anchor.submission.respondedAt, now).filter((type) =>
      FOLLOWUP_TYPES.includes(type),
    );

    for (const type of dueTypes) {
      try {
        const result = await previewOrSend({
          recipient: {
            userId: anchor.userId,
            email: anchor.email,
            firstName: anchor.firstName,
            ownsPlaybook: anchor.ownsPlaybook,
          },
          type,
          submission: type === "FOLLOWUP_DRILLS_DAY_2" ? anchor.submission : undefined,
          anchorDate: anchor.submission.respondedAt,
          dryRun,
          previews,
        });
        if (result.sent) {
          sent += 1;
        } else if (result.skipped) {
          skipped += 1;
        }
      } catch (error) {
        errors.push(
          `${type} for ${anchor.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }

  return { dryRun, previews, sent, skipped, errors };
}

export async function sendTestMarketingEmail(params: {
  type: MarketingEmailTypeValue;
  toEmail: string;
  userId?: string;
}) {
  let recipient: MarketingEmailRecipient;

  if (params.userId) {
    const loaded = await loadUserMarketingRecipient(params.userId);
    if (!loaded) {
      throw new Error("User not found.");
    }
    recipient = { ...loaded, email: params.toEmail };
  } else {
    recipient = {
      userId: "test-user",
      email: params.toEmail,
      firstName: "Player",
      ownsPlaybook: false,
    };
  }

  const submission =
    params.type === "FOLLOWUP_DRILLS_DAY_2" ? buildMarketingTestSubmissionContext() : undefined;

  return sendMarketingEmail({
    recipient,
    type: params.type,
    submission,
    skipLog: true,
    subjectPrefix: "[TEST] ",
  });
}

