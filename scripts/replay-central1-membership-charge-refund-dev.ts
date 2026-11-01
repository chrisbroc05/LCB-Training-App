/**
 * Dev-only: replay membership charge.refunded ledger for central1@dev.lcbtraining.test.
 */
import {
  computeRefundCommissionCents,
  computeRefundNetCents,
} from "../lib/commission-ledger-shared";
import {
  isMembershipPaymentFullyRefunded,
  resolveMembershipRefundAmountPaidCents,
} from "../lib/membership-charge-refund-shared";
import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { prisma } from "../lib/prisma";
import { getStripe } from "../lib/stripe";

const EMAIL = "central1@dev.lcbtraining.test";

async function main() {
  assertDevOnlyScript("scripts/replay-central1-membership-charge-refund-dev.ts");
  const user = await prisma.user.findFirst({
    where: { email: EMAIL },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`User not found: ${EMAIL}`);
  }

  const payment = await prisma.membershipSubscriptionPayment.findFirst({
    where: { userId: user.id, stripeChargeId: { not: null } },
    orderBy: { paidAt: "asc" },
  });
  if (!payment?.stripeChargeId) {
    throw new Error("No membership payment with stripeChargeId for central1");
  }

  const charge = await getStripe().charges.retrieve(payment.stripeChargeId);
  const refundedAt = new Date();
  const refundAmountPaidCents = resolveMembershipRefundAmountPaidCents({
    chargeAmountRefundedCents: charge.amount_refunded,
    paymentAmountPaidCents: payment.amountPaidCents,
  });

  await prisma.membershipSubscriptionPayment.update({
    where: { id: payment.id },
    data: {
      refundedAt: isMembershipPaymentFullyRefunded({
        chargeAmountRefundedCents: charge.amount_refunded,
        paymentAmountPaidCents: payment.amountPaidCents,
      })
        ? refundedAt
        : payment.refundedAt,
    },
  });

  const original = await prisma.orgCommissionLedgerEntry.findFirst({
    where: {
      stripeInvoiceId: payment.stripeInvoiceId,
      isRefund: false,
      commissionFeePending: false,
    },
  });
  if (!original) {
    throw new Error("No original commission ledger row");
  }

  const refundCommissionCents = computeRefundCommissionCents({
    originalCommissionCents: original.commissionCents,
    originalAmountPaidCents: original.amountPaidCents,
    refundAmountPaidCents,
  });
  const refundNetCents = computeRefundNetCents({
    originalNetCents: original.netCents ?? original.amountPaidCents,
    originalAmountPaidCents: original.amountPaidCents,
    refundAmountPaidCents,
  });
  const signedRefundPaidCents = -refundAmountPaidCents;

  const existingRefund = await prisma.orgCommissionLedgerEntry.findFirst({
    where: { stripeInvoiceId: payment.stripeInvoiceId, isRefund: true },
  });

  const ledgerData = {
    organizationId: original.organizationId,
    userId: user.id,
    stripeInvoiceId: payment.stripeInvoiceId,
    level: payment.level ?? original.level ?? undefined,
    billingInterval: payment.billingInterval ?? original.billingInterval ?? undefined,
    amountPaidCents: signedRefundPaidCents,
    processingFeeCents: null,
    netCents: refundNetCents,
    paymentCents: signedRefundPaidCents,
    commissionRate: original.commissionRate,
    commissionCents: refundCommissionCents,
    commissionFeePending: false,
    paidAt: refundedAt,
    isRefund: true,
  };

  if (existingRefund) {
    await prisma.orgCommissionLedgerEntry.update({
      where: { id: existingRefund.id },
      data: ledgerData,
    });
  } else {
    await prisma.orgCommissionLedgerEntry.create({ data: ledgerData });
  }

  console.log("refundAmountPaidCents", refundAmountPaidCents, "commission", refundCommissionCents);

  const ledger = await prisma.orgCommissionLedgerEntry.findMany({
    where: { userId: user.id, stripeInvoiceId: payment.stripeInvoiceId },
    orderBy: { paidAt: "asc" },
  });
  console.log("ledger:", ledger);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
