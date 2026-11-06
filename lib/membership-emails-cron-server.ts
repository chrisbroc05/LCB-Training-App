import "server-only";

import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import {
  buildCommissionMonthlyReportEmailText,
  buildCommissionMonthlyReportPayoutStatus,
  buildCommissionMonthlyReportSubject,
  formatCommissionReportMonthLabel,
} from "@/lib/commission-monthly-report-shared";
import {
  buildCommissionMonthSummaries,
  listCommissionMonthKeysThrough,
} from "@/lib/commission-payout-shared";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email-delivery-server";
import { formatMembershipBillingDate } from "@/lib/format-date";
import { formatCommissionMonthKey } from "@/lib/commission-ledger-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { getPublicAppUrl } from "@/lib/public-app-url";
import {
  buildAnnualRenewalReminderDedupeKey,
  buildAnnualRenewalReminderEmailText,
  buildCommissionReportDedupeKey,
  shouldRunCommissionMonthlyReportToday,
} from "@/lib/membership-emails-cron-shared";

export { shouldRunCommissionMonthlyReportToday } from "@/lib/membership-emails-cron-shared";

const RENEWAL_REMINDER_DAYS = 30;

export type AnnualRenewalReminderPreview = {
  channel: "annual-renewal-reminder";
  userId: string;
  to: string;
  subject: string;
};

export async function runAnnualRenewalReminderEmails(params: {
  now?: Date;
  dryRun?: boolean;
} = {}) {
  const now = params.now ?? new Date();
  const windowStart = new Date(now);
  windowStart.setUTCDate(windowStart.getUTCDate() + RENEWAL_REMINDER_DAYS - 1);
  const windowEnd = new Date(now);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + RENEWAL_REMINDER_DAYS + 1);

  const subs = await prisma.membershipSubscription.findMany({
    where: {
      billingInterval: "ANNUAL",
      status: { in: ["ACTIVE", "CANCEL_AT_PERIOD_END"] },
      currentPeriodEnd: { gte: windowStart, lte: windowEnd },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  const previews: AnnualRenewalReminderPreview[] = [];

  for (const sub of subs) {
    const email = sub.user.email?.trim();
    if (!email) {
      skipped += 1;
      continue;
    }
    const dedupeKey = buildAnnualRenewalReminderDedupeKey(sub.userId, sub.currentPeriodEnd);
    const existing = await prisma.membershipEmailLog.findUnique({ where: { dedupeKey } });
    if (existing) {
      skipped += 1;
      continue;
    }

    const renewalLabel = formatMembershipBillingDate(sub.currentPeriodEnd);
    const levelKey = sub.level as MembershipLevelKey;
    const subject = "Your LCB annual membership renews soon";
    const body = buildAnnualRenewalReminderEmailText({
      displayName: sub.user.name?.trim() || "there",
      level: levelKey,
      renewalDateLabel: renewalLabel,
    });

    if (params.dryRun) {
      previews.push({
        channel: "annual-renewal-reminder",
        userId: sub.userId,
        to: email,
        subject,
      });
      sent += 1;
      continue;
    }

    await sendNotificationEmail({ from: process.env.NOTIFICATION_EMAIL, to: email, subject, text: body });
    await prisma.membershipEmailLog.create({
      data: {
        userId: sub.userId,
        type: "ANNUAL_RENEWAL_REMINDER",
        dedupeKey,
      },
    });
    sent += 1;
  }

  return { sent, skipped, previews };
}

export type CommissionMonthlyReportPreview = {
  channel: "commission-monthly-report";
  to: string;
  subject: string;
  monthKey: string;
};

export async function runCommissionMonthlyReportEmail(params: { now?: Date; dryRun?: boolean } = {}) {
  const now = params.now ?? new Date();
  const priorMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const monthKey = formatCommissionMonthKey(priorMonth);
  const monthLabel = formatCommissionReportMonthLabel(monthKey);
  const monthStart = new Date(Date.UTC(priorMonth.getUTCFullYear(), priorMonth.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(priorMonth.getUTCFullYear(), priorMonth.getUTCMonth() + 1, 1));

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return {
      sent: 0,
      skipped: 0,
      errors: ["ADMIN_EMAIL missing"] as string[],
      preview: null as CommissionMonthlyReportPreview | null,
    };
  }

  const dedupeKey = buildCommissionReportDedupeKey(monthKey);
  const existing = await prisma.membershipEmailLog.findFirst({
    where: { dedupeKey, type: "COMMISSION_MONTHLY_REPORT" },
  });
  if (existing) {
    return { sent: 0, skipped: 1, errors: [] as string[], preview: null };
  }

  const orgs = await prisma.organization.findMany({
    where: { active: true, commissionRate: { gt: 0 } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (orgs.length === 0) {
    return { sent: 0, skipped: 1, errors: [] as string[], preview: null };
  }

  const orgLines: Array<{
    orgName: string;
    monthNetCents: number;
    carriedInCents: number;
    payoutStatus: string;
    amountDueCents: number;
    ledgerLines: Array<{
      playerLabel: string;
      amountPaidCents: number;
      processingFeeCents: number | null;
      netCents: number | null;
      commissionRate: number;
      commissionCents: number;
      commissionFeePending: boolean;
      isRefund: boolean;
    }>;
  }> = [];

  let totalDueCents = 0;

  for (const org of orgs) {
    const [monthEntries, allEntries, payouts] = await Promise.all([
      prisma.orgCommissionLedgerEntry.findMany({
        where: {
          organizationId: org.id,
          paidAt: { gte: monthStart, lt: monthEnd },
        },
        select: {
          commissionCents: true,
          commissionFeePending: true,
          amountPaidCents: true,
          processingFeeCents: true,
          netCents: true,
          commissionRate: true,
          isRefund: true,
          user: {
            select: { playerFirstName: true, playerLastName: true, name: true, email: true },
          },
        },
      }),
      prisma.orgCommissionLedgerEntry.findMany({
        where: { organizationId: org.id },
        select: { commissionCents: true, paidAt: true, commissionFeePending: true },
      }),
      prisma.orgCommissionPayout.findMany({
        where: { organizationId: org.id },
        select: { monthKey: true, amountCents: true, paidAt: true, method: true, note: true },
      }),
    ]);

    const monthNetCents = monthEntries.reduce(
      (sum, row) => (row.commissionFeePending ? sum : sum + row.commissionCents),
      0,
    );
    const entries = allEntries.map((row) => ({
      commissionCents: row.commissionCents,
      paidAt: row.paidAt,
      commissionFeePending: row.commissionFeePending,
    }));
    const monthKeys = listCommissionMonthKeysThrough(entries, priorMonth);
    const summaries = buildCommissionMonthSummaries({
      monthKeys,
      entries,
      payouts: payouts.map((payout) => ({
        monthKey: payout.monthKey,
        paid: true,
        amountCents: payout.amountCents,
        paidAt: payout.paidAt.toISOString(),
        method: payout.method,
        note: payout.note,
      })),
    });
    const monthSummary = summaries.find((row) => row.monthKey === monthKey);
    const carriedInCents = monthSummary?.carriedInCents ?? 0;
    const payoutStatus = monthSummary
      ? buildCommissionMonthlyReportPayoutStatus(monthSummary)
      : "Nothing due";
    const amountDueCents =
      monthSummary && !monthSummary.paid ? monthSummary.amountDueCents : 0;

    if (!monthSummary?.paid) {
      totalDueCents += amountDueCents;
    }

    orgLines.push({
      orgName: org.name,
      monthNetCents,
      carriedInCents,
      payoutStatus,
      amountDueCents,
      ledgerLines: monthEntries.map((row) => {
        const first = row.user.playerFirstName?.trim() || row.user.name?.trim().split(/\s+/)[0] || "";
        const last = row.user.playerLastName?.trim() || "";
        const playerLabel = [first, last].filter(Boolean).join(" ") || row.user.email;
        return {
          playerLabel,
          amountPaidCents: row.amountPaidCents,
          processingFeeCents: row.processingFeeCents,
          netCents: row.netCents,
          commissionRate: row.commissionRate,
          commissionCents: row.commissionCents,
          commissionFeePending: row.commissionFeePending,
          isRefund: row.isRefund,
        };
      }),
    });
  }

  const commissionsUrl = `${getPublicAppUrl()}${ADMIN_ROUTES.business.commissions}`;
  const subject = buildCommissionMonthlyReportSubject({ monthLabel, totalDueCents });
  const body = buildCommissionMonthlyReportEmailText({
    monthKey,
    monthLabel,
    orgLines,
    commissionsUrl,
  });

  if (params.dryRun) {
    return {
      sent: 0,
      skipped: 0,
      errors: [] as string[],
      preview: {
        channel: "commission-monthly-report",
        to: adminEmail,
        subject,
        monthKey,
      } satisfies CommissionMonthlyReportPreview,
    };
  }

  await sendNotificationEmail({
    from: process.env.NOTIFICATION_EMAIL,
    to: adminEmail,
    subject,
    text: body,
  });
  const systemUser = await prisma.user.findFirst({
    where: { email: adminEmail },
    select: { id: true },
  });
  if (systemUser) {
    await prisma.membershipEmailLog.create({
      data: {
        userId: systemUser.id,
        type: "COMMISSION_MONTHLY_REPORT",
        dedupeKey,
      },
    });
  }

  return { sent: 1, skipped: 0, errors: [] as string[], preview: null };
}
