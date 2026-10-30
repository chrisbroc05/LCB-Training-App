import "server-only";

import { isCompanyMailingAddressConfigured } from "@/lib/marketing-email-guard-server";
import { getCompanyMailingAddress } from "@/lib/email-layout";
import {
  excludeLeadFromMarketing,
  leadMarketingEligibleWhere,
  syncAdminEmailLeadMarketingExclusions,
} from "@/lib/lead-marketing-server";
import { LEAD_MARKETING_EXCLUDED_REASON_MANUAL } from "@/lib/lead-marketing-shared";
import { sendLegacyLeadFreeAccountInviteEmail } from "@/lib/resource-emails-server";
import { getMarketingEmailsStartAt, isBeforeMarketingEmailsStart } from "@/lib/marketing-emails-start-shared";
import { prisma } from "@/lib/prisma";

export const LEGACY_LEAD_INVITE_EMAIL_TYPE = "LEGACY_LEAD_FREE_ACCOUNT_INVITE";

export type LegacyLeadInvitePreviewRow = {
  id: string;
  email: string;
  firstName: string;
  createdAt: string;
  source: string;
  marketingExcludedAt: string | null;
  marketingExcludedReason: string | null;
};

export type LegacyLeadInvitePreview = {
  eligibleCount: number;
  alreadySentCount: number;
  excludedCount: number;
  leads: LegacyLeadInvitePreviewRow[];
  blockedMissingAddress: boolean;
  marketingStartAt: string | null;
};

function legacyEligibleBaseWhere(start: Date | null) {
  return {
    ...leadMarketingEligibleWhere(),
    userId: null,
    ...(start ? { createdAt: { lt: start } } : {}),
  };
}

export async function previewLegacyLeadInviteCampaign(params?: {
  listLimit?: number;
}): Promise<LegacyLeadInvitePreview> {
  await syncAdminEmailLeadMarketingExclusions();

  const start = getMarketingEmailsStartAt();
  const addressConfigured = isCompanyMailingAddressConfigured();
  const baseWhere = legacyEligibleBaseWhere(start);
  const listLimit = Math.min(Math.max(params?.listLimit ?? 50, 1), 200);

  const notSentWhere = {
    ...baseWhere,
    emailLogs: { none: { type: LEGACY_LEAD_INVITE_EMAIL_TYPE } },
  };

  const [eligibleCount, alreadySentCount, excludedCount, listLeads] = await Promise.all([
    prisma.lead.count({ where: notSentWhere }),
    prisma.lead.count({
      where: {
        ...baseWhere,
        emailLogs: { some: { type: LEGACY_LEAD_INVITE_EMAIL_TYPE } },
      },
    }),
    prisma.lead.count({
      where: {
        unsubscribedAt: null,
        userId: null,
        marketingExcludedAt: { not: null },
        ...(start ? { createdAt: { lt: start } } : {}),
      },
    }),
    prisma.lead.findMany({
      where: notSentWhere,
      select: {
        id: true,
        email: true,
        firstName: true,
        createdAt: true,
        source: true,
        marketingExcludedAt: true,
        marketingExcludedReason: true,
      },
      orderBy: { createdAt: "asc" },
      take: listLimit,
    }),
  ]);

  return {
    eligibleCount,
    alreadySentCount,
    excludedCount,
    leads: listLeads.map((lead) => ({
      id: lead.id,
      email: lead.email,
      firstName: lead.firstName,
      createdAt: lead.createdAt.toISOString(),
      source: lead.source,
      marketingExcludedAt: lead.marketingExcludedAt?.toISOString() ?? null,
      marketingExcludedReason: lead.marketingExcludedReason,
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

export async function excludeLegacyLeadFromMarketing(params: {
  leadId: string;
  reason?: string;
}) {
  return excludeLeadFromMarketing({
    leadId: params.leadId,
    reason: params.reason?.trim() || LEAD_MARKETING_EXCLUDED_REASON_MANUAL,
  });
}

export async function sendLegacyLeadInviteCampaign(params: {
  leadIds: string[];
}) {
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

  const uniqueIds = [...new Set(params.leadIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return {
      ok: false as const,
      error: "Select at least one lead to send.",
    };
  }

  if (uniqueIds.length > 200) {
    return {
      ok: false as const,
      error: "Send at most 200 leads per batch.",
    };
  }

  await syncAdminEmailLeadMarketingExclusions();

  const leads = await prisma.lead.findMany({
    where: {
      id: { in: uniqueIds },
      ...legacyEligibleBaseWhere(start),
      emailLogs: { none: { type: LEGACY_LEAD_INVITE_EMAIL_TYPE } },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      createdAt: true,
    },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  const leadById = new Map(leads.map((lead) => [lead.id, lead]));

  for (const leadId of uniqueIds) {
    const lead = leadById.get(leadId);
    if (!lead) {
      skipped += 1;
      errors.push(`${leadId}: not eligible (excluded, already sent, or not legacy).`);
      continue;
    }

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
