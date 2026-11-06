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
  loadOrgTrialSubmissionReminderCandidates,
  loadMarketingFollowupAnchors,
  loadUserMarketingRecipient,
} from "@/lib/marketing-email-data";
import {
  buildMarketingTestSubmissionContext,
  type FollowupSubmissionContext,
  type MarketingEmailRecipient,
} from "@/lib/marketing-email-templates";
import { isCompanyMailingAddressConfigured } from "@/lib/marketing-email-guard-server";
import {
  hasMarketingEmailBeenSent,
  sendMarketingEmail,
} from "@/lib/marketing-email-send";
import { resolveUserMarketingDeliveryEmail } from "@/lib/marketing-recipient-server";
import { getMarketingEmailSubjectLine } from "@/lib/marketing-email-subject-shared";

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

  const delivery = await resolveUserMarketingDeliveryEmail(params.recipient.userId);
  if (delivery.skipped) {
    return { sent: false, skipped: true };
  }

  params.previews.push({
    channel: "marketing-email",
    type: params.type,
    userId: params.recipient.userId,
    firstName: params.recipient.firstName,
    to: delivery.toEmail,
    subject: getMarketingEmailSubjectLine(params.type),
    anchorSubmissionId: params.submission?.submissionId ?? null,
    anchorDate: params.anchorDate.toISOString(),
    ageDays: getMarketingEmailAgeDays(params.anchorDate),
    window: formatMarketingEmailWindow(params.type),
  });

  if (params.dryRun) {
    return { sent: false, skipped: false };
  }

  const subject = await sendMarketingEmail({
    recipient: params.recipient,
    type: params.type,
    submission: params.submission,
  });

  if (subject === null) {
    return { sent: false, skipped: true };
  }

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

  if (!isCompanyMailingAddressConfigured()) {
    if (dryRun) {
      errors.push(
        "COMPANY_MAILING_ADDRESS is not set (marketing previews only; real sends would be skipped).",
      );
    } else {
      console.warn(
        "[marketing-email-scheduler] COMPANY_MAILING_ADDRESS is not set. Skipping user marketing emails.",
      );
      return { dryRun, previews, sent: 0, skipped: 0, errors: [] };
    }
  }

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

  const orgTrialReminderCandidates = await loadOrgTrialSubmissionReminderCandidates(now);
  for (const candidate of orgTrialReminderCandidates) {
    try {
      const result = await previewOrSend({
        recipient: candidate,
        type: "ORG_TRIAL_SUBMISSION_REMINDER",
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
        `ORG_TRIAL_SUBMISSION_REMINDER for ${candidate.email}: ${
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
            accountRole: anchor.accountRole,
            accountHolderFirstName: anchor.accountHolderFirstName,
            ownsPlaybook: anchor.ownsPlaybook,
            playbookBreakdownsRemaining: anchor.playbookBreakdownsRemaining,
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
  if (params.type === "MEMBERSHIP_LEVEL_WELCOME") {
    throw new Error(
      "Membership level welcome emails are transactional and are not sent through the marketing pipeline.",
    );
  }

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

