import "server-only";

import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  computeCommissionCents,
  computeCommissionRateForPayment,
  computeRefundCommissionCents,
  computeRefundNetCents,
} from "@/lib/commission-ledger-shared";
import { prisma } from "@/lib/prisma";

export async function userIsCommissionEligible(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      commissionEligible: true,
      commissionEligibleAdminOverride: true,
      commissionAttributionOrgId: true,
      organization: { select: { billingMode: true } },
    },
  });
  if (!user) {
    return false;
  }
  if (user.commissionEligibleAdminOverride) {
    return true;
  }
  if (user.organization?.billingMode === "CLUB_PAY") {
    return false;
  }
  if (user.commissionAttributionOrgId) {
    const attributionOrg = await prisma.organization.findUnique({
      where: { id: user.commissionAttributionOrgId },
      select: { billingMode: true },
    });
    if (attributionOrg?.billingMode === "CLUB_PAY") {
      return false;
    }
  }
  return user.commissionEligible;
}

export async function recordCommissionLedgerForMembershipInvoice(params: {
  userId: string;
  stripeInvoiceId: string;
  amountPaidCents: number;
  processingFeeCents: number | null;
  netCents: number | null;
  commissionFeePending: boolean;
  paidAt: Date;
  level: MembershipLevelKey | null;
  billingInterval: MembershipBillingIntervalKey | null;
  isRefund?: boolean;
}) {
  const signedAmountPaidCents = params.isRefund
    ? -Math.abs(params.amountPaidCents)
    : Math.abs(params.amountPaidCents);

  if (Math.abs(signedAmountPaidCents) <= 0) {
    return { recorded: false as const, reason: "zero_payment" as const };
  }

  const eligible = await userIsCommissionEligible(params.userId);
  if (!eligible) {
    return { recorded: false as const, reason: "ineligible" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      commissionAttributionOrgId: true,
      commissionAttributionJoinedAt: true,
    },
  });
  if (!user?.commissionAttributionOrgId || !user.commissionAttributionJoinedAt) {
    return { recorded: false as const, reason: "no_attribution" as const };
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.commissionAttributionOrgId },
    select: {
      commissionRate: true,
      commissionMonths: true,
      ongoingCommissionRate: true,
      commissionEndsAt: true,
    },
  });
  if (!org) {
    return { recorded: false as const, reason: "org_missing" as const };
  }

  const rate = computeCommissionRateForPayment({
    org,
    attributionJoinedAt: user.commissionAttributionJoinedAt,
    paidAt: params.paidAt,
  });

  const feePending = params.commissionFeePending || params.netCents == null;
  const signedNetCents =
    params.netCents == null
      ? null
      : params.isRefund
        ? -Math.abs(params.netCents)
        : Math.abs(params.netCents);

  const commissionCents = feePending
    ? 0
    : computeCommissionCents(signedNetCents ?? 0, rate);
  const signedCommissionCents = params.isRefund ? -Math.abs(commissionCents) : commissionCents;

  if (!feePending && signedCommissionCents === 0) {
    return { recorded: false as const, reason: "zero_commission" as const };
  }

  const existingLedger = await prisma.orgCommissionLedgerEntry.findFirst({
    where: {
      stripeInvoiceId: params.stripeInvoiceId,
      isRefund: Boolean(params.isRefund),
    },
  });

  const ledgerData = {
    organizationId: user.commissionAttributionOrgId,
    userId: params.userId,
    stripeInvoiceId: params.stripeInvoiceId,
    level: params.level ?? undefined,
    billingInterval: billingIntervalToPrisma(params.billingInterval),
    amountPaidCents: signedAmountPaidCents,
    processingFeeCents: params.processingFeeCents,
    netCents: signedNetCents,
    paymentCents: signedAmountPaidCents,
    commissionRate: rate,
    commissionCents: signedCommissionCents,
    commissionFeePending: feePending,
    paidAt: params.paidAt,
    isRefund: Boolean(params.isRefund),
  };

  if (existingLedger) {
    if (!existingLedger.commissionFeePending && !feePending) {
      return { recorded: false as const, reason: "duplicate" as const };
    }
    await prisma.orgCommissionLedgerEntry.update({
      where: { id: existingLedger.id },
      data: ledgerData,
    });
    return { recorded: true as const, updated: true as const, feePending };
  }

  await prisma.orgCommissionLedgerEntry.create({ data: ledgerData });

  return { recorded: true as const, updated: false as const, feePending };
}

export async function recordCommissionRefundForMembershipPayment(params: {
  userId: string;
  stripeInvoiceId: string;
  refundAmountPaidCents: number;
  paidAt: Date;
  level: MembershipLevelKey | null;
  billingInterval: MembershipBillingIntervalKey | null;
}) {
  const original = await prisma.orgCommissionLedgerEntry.findFirst({
    where: {
      stripeInvoiceId: params.stripeInvoiceId,
      isRefund: false,
      commissionFeePending: false,
    },
  });
  if (!original || original.commissionCents <= 0) {
    return { recorded: false as const, reason: "no_original_commission" as const };
  }

  const refundCommissionCents = computeRefundCommissionCents({
    originalCommissionCents: original.commissionCents,
    originalAmountPaidCents: original.amountPaidCents,
    refundAmountPaidCents: params.refundAmountPaidCents,
  });
  if (refundCommissionCents === 0) {
    return { recorded: false as const, reason: "zero_commission" as const };
  }

  const refundNetCents = computeRefundNetCents({
    originalNetCents: original.netCents ?? original.amountPaidCents,
    originalAmountPaidCents: original.amountPaidCents,
    refundAmountPaidCents: params.refundAmountPaidCents,
  });

  const signedRefundPaidCents = -Math.abs(params.refundAmountPaidCents);
  const ledgerData = {
    organizationId: original.organizationId,
    userId: params.userId,
    stripeInvoiceId: params.stripeInvoiceId,
    level: params.level ?? original.level ?? undefined,
    billingInterval: billingIntervalToPrisma(params.billingInterval) ?? original.billingInterval,
    amountPaidCents: signedRefundPaidCents,
    processingFeeCents: null,
    netCents: refundNetCents,
    paymentCents: signedRefundPaidCents,
    commissionRate: original.commissionRate,
    commissionCents: refundCommissionCents,
    commissionFeePending: false,
    paidAt: params.paidAt,
    isRefund: true,
  };

  const existingRefund = await prisma.orgCommissionLedgerEntry.findFirst({
    where: { stripeInvoiceId: params.stripeInvoiceId, isRefund: true },
  });
  if (existingRefund) {
    if (
      existingRefund.amountPaidCents === signedRefundPaidCents &&
      existingRefund.commissionCents === refundCommissionCents
    ) {
      return { recorded: false as const, reason: "duplicate" as const };
    }
    await prisma.orgCommissionLedgerEntry.update({
      where: { id: existingRefund.id },
      data: ledgerData,
    });
    return { recorded: true as const, updated: true as const };
  }

  await prisma.orgCommissionLedgerEntry.create({ data: ledgerData });

  return { recorded: true as const, updated: false as const };
}

export async function ensureCommissionLedgerForMembershipPayment(params: {
  stripeInvoiceId: string;
}) {
  const payment = await prisma.membershipSubscriptionPayment.findUnique({
    where: { stripeInvoiceId: params.stripeInvoiceId },
    select: {
      userId: true,
      membershipSubscriptionId: true,
      level: true,
      billingInterval: true,
      amountPaidCents: true,
      processingFeeCents: true,
      netCents: true,
      commissionFeePending: true,
      paidAt: true,
    },
  });
  if (!payment || payment.amountPaidCents <= 0) {
    return { recorded: false as const, reason: "no_payment" as const };
  }

  let userId = payment.userId;
  if (!userId && payment.membershipSubscriptionId) {
    const subscription = await prisma.membershipSubscription.findUnique({
      where: { id: payment.membershipSubscriptionId },
      select: { userId: true },
    });
    userId = subscription?.userId ?? null;
  }
  if (!userId || !payment.level) {
    return { recorded: false as const, reason: "incomplete_payment" as const };
  }

  return recordCommissionLedgerForMembershipInvoice({
    userId,
    stripeInvoiceId: params.stripeInvoiceId,
    amountPaidCents: payment.amountPaidCents,
    processingFeeCents: payment.processingFeeCents,
    netCents: payment.netCents,
    commissionFeePending: payment.commissionFeePending,
    paidAt: payment.paidAt,
    level: payment.level as MembershipLevelKey,
    billingInterval: (payment.billingInterval as MembershipBillingIntervalKey | null) ?? null,
  });
}

function billingIntervalToPrisma(interval: MembershipBillingIntervalKey | null) {
  if (!interval) {
    return undefined;
  }
  return interval;
}
