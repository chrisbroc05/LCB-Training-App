import "server-only";

import { isCompanyMailingAddressConfigured } from "@/lib/marketing-email-guard-server";
import { isOnOrAfterMarketingEmailsStart } from "@/lib/marketing-emails-start-shared";
import { getLeadLatestResourceTitle } from "@/lib/leads-server";
import { sendLeadFreeAccountInviteEmail } from "@/lib/resource-emails-server";
import { prisma } from "@/lib/prisma";

const LEAD_INVITE_TYPE = "LEAD_FREE_ACCOUNT_INVITE";
const DAY_MS = 24 * 60 * 60 * 1000;
const INVITE_MIN_DAYS = 3;
const INVITE_MAX_DAYS = 4;

export type LeadEmailSchedulerResult = {
  sent: number;
  skipped: number;
  errors: string[];
  blockedMissingAddress: boolean;
};

function isInInviteWindow(createdAt: Date, now: Date) {
  const ageDays = Math.floor((now.getTime() - createdAt.getTime()) / DAY_MS);
  return ageDays >= INVITE_MIN_DAYS && ageDays <= INVITE_MAX_DAYS;
}

export async function runLeadEmailScheduler(params?: { now?: Date }): Promise<LeadEmailSchedulerResult> {
  const now = params?.now ?? new Date();
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  if (!isCompanyMailingAddressConfigured()) {
    console.warn(
      "[lead-email-scheduler] COMPANY_MAILING_ADDRESS is not set. Skipping lead follow-up emails.",
    );
    return { sent: 0, skipped: 0, errors: [], blockedMissingAddress: true };
  }

  const candidates = await prisma.lead.findMany({
    where: {
      unsubscribedAt: null,
      userId: null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      createdAt: true,
    },
    take: 500,
  });

  for (const lead of candidates) {
    if (!isOnOrAfterMarketingEmailsStart(lead.createdAt)) {
      continue;
    }

    if (!isInInviteWindow(lead.createdAt, now)) {
      continue;
    }

    const dedupeKey = `${lead.id}:${LEAD_INVITE_TYPE}`;
    const existing = await prisma.leadEmailLog.findUnique({
      where: { dedupeKey },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    try {
      const resourceTitle = await getLeadLatestResourceTitle(lead.id);
      await sendLeadFreeAccountInviteEmail({
        toEmail: lead.email,
        firstName: lead.firstName,
        leadId: lead.id,
        resourceTitle,
      });
      await prisma.leadEmailLog.create({
        data: {
          leadId: lead.id,
          type: LEAD_INVITE_TYPE,
          dedupeKey,
        },
      });
      sent += 1;
    } catch (error) {
      errors.push(
        `${lead.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return { sent, skipped, errors, blockedMissingAddress: false };
}
