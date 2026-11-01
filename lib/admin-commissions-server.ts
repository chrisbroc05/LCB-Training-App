import "server-only";

import type { AdminCommissionOrgDetail } from "@/lib/admin-commissions-shared";
import { formatCommissionEligibilityLabel } from "@/lib/commission-eligibility-shared";
import {
  buildCommissionMonthSummaries,
  listCommissionMonthKeysThrough,
} from "@/lib/commission-payout-shared";
import { getPlayerFullName } from "@/lib/account-shared";
import { prisma } from "@/lib/prisma";

export async function loadAdminCommissionOrgSummary(orgId: string): Promise<AdminCommissionOrgDetail | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      billingMode: true,
      commissionRate: true,
      commissionMonths: true,
      ongoingCommissionRate: true,
      commissionEndsAt: true,
    },
  });
  if (!org) {
    return null;
  }

  const [ledgerRows, payouts, familiesRaw] = await Promise.all([
    prisma.orgCommissionLedgerEntry.findMany({
      where: { organizationId: orgId },
      orderBy: { paidAt: "desc" },
      select: {
        id: true,
        paidAt: true,
        amountPaidCents: true,
        processingFeeCents: true,
        netCents: true,
        paymentCents: true,
        commissionCents: true,
        commissionRate: true,
        commissionFeePending: true,
        isRefund: true,
        level: true,
        billingInterval: true,
        user: {
          select: {
            email: true,
            name: true,
            playerFirstName: true,
            playerLastName: true,
          },
        },
      },
    }),
    prisma.orgCommissionPayout.findMany({
      where: { organizationId: orgId },
      orderBy: { monthKey: "asc" },
      select: {
        monthKey: true,
        amountCents: true,
        paidAt: true,
        method: true,
        note: true,
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ commissionAttributionOrgId: orgId }, { organizationId: orgId }],
      },
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        playerFirstName: true,
        playerLastName: true,
        name: true,
        commissionEligible: true,
        commissionIneligibleReason: true,
        commissionEligibleAdminOverride: true,
        commissionOverrideNote: true,
      },
    }),
  ]);

  const entries = ledgerRows.map((entry) => ({
    commissionCents: entry.commissionCents,
    paidAt: entry.paidAt,
    commissionFeePending: entry.commissionFeePending,
  }));

  const monthKeys = listCommissionMonthKeysThrough(entries);
  const monthSummaries = buildCommissionMonthSummaries({
    monthKeys,
    entries,
    payouts: payouts.map((p) => ({
      monthKey: p.monthKey,
      paid: true,
      amountCents: p.amountCents,
      paidAt: p.paidAt.toISOString(),
      method: p.method,
      note: p.note,
    })),
  });

  const families = familiesRaw.map((user) => {
    const effectiveEligible =
      user.commissionEligibleAdminOverride || user.commissionEligible;
    return {
      userId: user.id,
      email: user.email,
      playerName: getPlayerFullName(user),
      commissionEligible: user.commissionEligible,
      commissionIneligibleReason: user.commissionIneligibleReason,
      commissionEligibleAdminOverride: user.commissionEligibleAdminOverride,
      commissionOverrideNote: user.commissionOverrideNote,
      eligibilityLabel: formatCommissionEligibilityLabel({
        eligible: effectiveEligible,
        reason: user.commissionIneligibleReason,
        adminOverride: user.commissionEligibleAdminOverride,
      }),
    };
  });

  return {
    org: {
      ...org,
      commissionEndsAt: org.commissionEndsAt?.toISOString() ?? null,
    },
    monthSummaries,
    families,
    ledger: ledgerRows.slice(0, 100).map((entry) => ({
      id: entry.id,
      paidAt: entry.paidAt.toISOString(),
      amountPaidCents: entry.amountPaidCents,
      processingFeeCents: entry.processingFeeCents,
      netCents: entry.netCents,
      paymentCents: entry.paymentCents,
      commissionCents: entry.commissionCents,
      commissionRate: entry.commissionRate,
      commissionFeePending: entry.commissionFeePending,
      isRefund: entry.isRefund,
      level: entry.level,
      billingInterval: entry.billingInterval,
      memberEmail: entry.user.email,
      memberName: getPlayerFullName(entry.user),
      playerFirstName: entry.user.playerFirstName,
      playerLastName: entry.user.playerLastName,
    })),
  };
}

export async function loadAdminCommissionOrgExport(orgId: string, monthKey: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
  if (!org) {
    return null;
  }

  const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));

  const ledgerRows = await prisma.orgCommissionLedgerEntry.findMany({
    where: {
      organizationId: orgId,
      paidAt: { gte: monthStart, lt: monthEnd },
    },
    orderBy: { paidAt: "asc" },
    select: {
      paidAt: true,
      amountPaidCents: true,
      processingFeeCents: true,
      netCents: true,
      paymentCents: true,
      commissionCents: true,
      commissionRate: true,
      commissionFeePending: true,
      isRefund: true,
      level: true,
      billingInterval: true,
      user: { select: { playerFirstName: true, playerLastName: true } },
    },
  });

  const allEntries = await prisma.orgCommissionLedgerEntry.findMany({
    where: { organizationId: orgId },
    select: { commissionCents: true, paidAt: true, isRefund: true, commissionFeePending: true },
  });

  const entries = allEntries.map((e) => ({
    commissionCents: e.commissionCents,
    paidAt: e.paidAt,
    commissionFeePending: e.commissionFeePending,
  }));
  const monthKeys = listCommissionMonthKeysThrough(entries);
  const payouts = await prisma.orgCommissionPayout.findMany({
    where: { organizationId: orgId },
    select: { monthKey: true, amountCents: true, paidAt: true, method: true, note: true },
  });
  const summaries = buildCommissionMonthSummaries({
    monthKeys,
    entries,
    payouts: payouts.map((p) => ({
      monthKey: p.monthKey,
      paid: true,
      amountCents: p.amountCents,
      paidAt: p.paidAt.toISOString(),
      method: p.method,
      note: p.note,
    })),
  });
  const monthSummary = summaries.find((s) => s.monthKey === monthKey);

  let monthCommissionCents = 0;
  let refundCommissionCents = 0;
  for (const row of ledgerRows) {
    if (row.commissionFeePending) {
      continue;
    }
    if (row.isRefund) {
      refundCommissionCents += row.commissionCents;
    } else {
      monthCommissionCents += row.commissionCents;
    }
  }

  return {
    org,
    monthKey,
    rows: ledgerRows.map((row) => ({
      paidAt: row.paidAt.toISOString(),
      playerFirstName: row.user.playerFirstName,
      playerLastName: row.user.playerLastName,
      level: row.level,
      billingInterval: row.billingInterval,
      amountPaidCents: row.amountPaidCents,
      processingFeeCents: row.processingFeeCents,
      netCents: row.netCents,
      paymentCents: row.paymentCents,
      commissionRate: row.commissionRate,
      commissionCents: row.commissionCents,
      commissionFeePending: row.commissionFeePending,
      isRefund: row.isRefund,
    })),
    monthCommissionCents,
    refundCommissionCents,
    carriedBalanceCents: monthSummary?.carriedInCents ?? 0,
  };
}

export async function listAdminCommissionOrganizations() {
  return prisma.organization.findMany({
    where: { commissionRate: { gt: 0 } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function markOrgCommissionMonthPaid(params: {
  organizationId: string;
  monthKey: string;
  amountCents: number;
  paidAt: Date;
  method: string;
  note: string | null;
}) {
  return prisma.orgCommissionPayout.upsert({
    where: {
      organizationId_monthKey: {
        organizationId: params.organizationId,
        monthKey: params.monthKey,
      },
    },
    create: {
      organizationId: params.organizationId,
      monthKey: params.monthKey,
      amountCents: params.amountCents,
      paidAt: params.paidAt,
      method: params.method,
      note: params.note,
    },
    update: {
      amountCents: params.amountCents,
      paidAt: params.paidAt,
      method: params.method,
      note: params.note,
    },
  });
}

export async function updateMemberCommissionOverride(params: {
  userId: string;
  countForCommission: boolean;
  note: string | null;
}) {
  return prisma.user.update({
    where: { id: params.userId },
    data: {
      commissionEligibleAdminOverride: params.countForCommission,
      commissionOverrideNote: params.note,
      ...(params.countForCommission
        ? { commissionEligible: true, commissionIneligibleReason: null }
        : {}),
    },
    select: {
      id: true,
      commissionEligible: true,
      commissionIneligibleReason: true,
      commissionEligibleAdminOverride: true,
      commissionOverrideNote: true,
    },
  });
}
