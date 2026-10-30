import "server-only";

import { isCompanyMailingAddressConfigured } from "@/lib/marketing-email-guard-server";
import { getCompanyMailingAddress } from "@/lib/email-layout";
import { sendLegacyLeadFreeAccountInviteEmail } from "@/lib/resource-emails-server";
import { getMarketingEmailsStartAt, isBeforeMarketingEmailsStart } from "@/lib/marketing-emails-start-shared";
import { prisma } from "@/lib/prisma";

export const LEGACY_LEAD_INVITE_EMAIL_TYPE = "LEGACY_LEAD_FREE_ACCOUNT_INVITE";

export type LegacyLeadInvitePreview = {
  eligibleCount: number;
  alreadySentCount: number;
  sample: Array<{ id: string; email: string; firstName: string; createdAt: string; source: string }>;
  blockedMissingAddress: boolean;
  marketingStartAt: string | null;
};

export async function previewLegacyLeadInviteCampaign(): Promise<LegacyLeadInvitePreview> {
  const start = getMarketingEmailsStartAt();
  const mailingAddress = getCompanyMailingAddress();
  const addressConfigured = isCompanyMailingAddressConfigured();

  const baseWhere = {
    unsubscribedAt: null,
    userId: null,
    ...(start ? { createdAt: { lt: start } } : {}),
  };

  const [eligibleCount, alreadySentCount, sampleLeads] = await Promise.all([
    prisma.lead.count({
      where: {
        ...baseWhere,
        emailLogs: { none: { type: LEGACY_LEAD_INVITE_EMAIL_TYPE } },
      },
    }),
    prisma.lead.count({
      where: {
        ...baseWhere,
        emailLogs: { some: { type: LEGACY_LEAD_INVITE_EMAIL_TYPE } },
      },
    }),
    prisma.lead.findMany({
      where: {
        ...baseWhere,
        emailLogs: { none: { type: LEGACY_LEAD_INVITE_EMAIL_TYPE } },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        createdAt: true,
        source: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return {
    eligibleCount,
    alreadySentCount,
    sample: sampleLeads.map((lead) => ({
      id: lead.id,
      email: lead.email,
      firstName: lead.firstName,
      createdAt: lead.createdAt.toISOString(),
      source: lead.source,
    })),
    blockedMissingAddress: !addressConfigured,
    marketingStartAt: start?.toISOString() ?? null,
  };
}

/** Same filters as preview; for local/admin counts (not capped at 500). */
export async function countLegacyLeadInviteEligible() {
  const preview = await previewLegacyLeadInviteCampaign();
  return preview.eligibleCount;
}

export async function sendLegacyLeadInviteCampaign(params: { limit?: number }) {
  if (!isCompanyMailingAddressConfigured()) {
    return {
      ok: false as const,
      error: "Set COMPANY_MAILING_ADDRESS before sending lead marketing email.",
    };
  }

  const start = getMarketingEmailsStartAt();
  if (!start) {
    return {
      ok: false as const,
      error: "Set MARKETING_EMAILS_START_AT before using the legacy lead campaign (defines who is legacy).",
    };
  }

  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const leads = await prisma.lead.findMany({
    where: {
      unsubscribedAt: null,
      userId: null,
      createdAt: { lt: start },
      emailLogs: { none: { type: LEGACY_LEAD_INVITE_EMAIL_TYPE } },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    if (!isBeforeMarketingEmailsStart(lead.createdAt)) {
      skipped += 1;
      continue;
    }

    const dedupeKey = `${lead.id}:${LEGACY_LEAD_INVITE_EMAIL_TYPE}`;
    const existing = await prisma.leadEmailLog.findUnique({
      where: { dedupeKey },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    try {
      await sendLegacyLeadFreeAccountInviteEmail({
        toEmail: lead.email,
        firstName: lead.firstName,
        leadId: lead.id,
      });
      await prisma.leadEmailLog.create({
        data: {
          leadId: lead.id,
          type: LEGACY_LEAD_INVITE_EMAIL_TYPE,
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

  return { ok: true as const, sent, skipped, errors };
}
