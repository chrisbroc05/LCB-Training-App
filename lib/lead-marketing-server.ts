import "server-only";

import {
  isAdminMarketingExcludedLeadEmail,
  LEAD_MARKETING_EXCLUDED_REASON_ADMIN_EMAIL,
  LEAD_MARKETING_EXCLUDED_REASON_MANUAL,
} from "@/lib/lead-marketing-shared";
import { normalizeLeadEmail } from "@/lib/leads-shared";
import { prisma } from "@/lib/prisma";

export function getAdminEmailForLeadMarketing() {
  return process.env.ADMIN_EMAIL?.trim().replace(/^['"]|['"]$/g, "") ?? null;
}

/** Leads that may receive automated or manual lead marketing email. */
export function leadMarketingEligibleWhere() {
  return {
    unsubscribedAt: null,
    marketingExcludedAt: null,
  } as const;
}

export async function excludeLeadFromMarketing(params: {
  leadId: string;
  reason: string;
}) {
  return prisma.lead.update({
    where: { id: params.leadId },
    data: {
      marketingExcludedAt: new Date(),
      marketingExcludedReason: params.reason.trim().slice(0, 500) || LEAD_MARKETING_EXCLUDED_REASON_MANUAL,
    },
    select: {
      id: true,
      email: true,
      marketingExcludedAt: true,
      marketingExcludedReason: true,
    },
  });
}

export async function syncAdminEmailLeadMarketingExclusions() {
  const adminEmail = getAdminEmailForLeadMarketing();
  if (!adminEmail) {
    return { updated: 0 };
  }

  const leads = await prisma.lead.findMany({
    where: {
      marketingExcludedAt: null,
    },
    select: { id: true, email: true },
    take: 5000,
  });

  const toExclude = leads.filter((lead) =>
    isAdminMarketingExcludedLeadEmail(lead.email, adminEmail),
  );

  if (toExclude.length === 0) {
    return { updated: 0 };
  }

  const now = new Date();
  await prisma.lead.updateMany({
    where: { id: { in: toExclude.map((lead) => lead.id) } },
    data: {
      marketingExcludedAt: now,
      marketingExcludedReason: LEAD_MARKETING_EXCLUDED_REASON_ADMIN_EMAIL,
    },
  });

  return { updated: toExclude.length };
}

export function buildLeadMarketingAutoExcludeData(email: string) {
  const adminEmail = getAdminEmailForLeadMarketing();
  if (!isAdminMarketingExcludedLeadEmail(normalizeLeadEmail(email), adminEmail)) {
    return null;
  }
  return {
    marketingExcludedAt: new Date(),
    marketingExcludedReason: LEAD_MARKETING_EXCLUDED_REASON_ADMIN_EMAIL,
  };
}
