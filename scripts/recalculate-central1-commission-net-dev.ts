/**
 * Dev-only: sync Stripe fee + re-post commission ledger for central1@dev.lcbtraining.test.
 */
import {
  computeCommissionCents,
  computeCommissionRateForPayment,
} from "../lib/commission-ledger-shared";
import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { prisma } from "../lib/prisma";
import { syncMembershipPaymentStripeFeeFromInvoice } from "../lib/membership-payment-stripe-fee-server";

const EMAIL = "central1@dev.lcbtraining.test";

async function main() {
  assertDevOnlyScript("scripts/recalculate-central1-commission-net-dev.ts");
  const user = await prisma.user.findFirst({
    where: { email: EMAIL },
    select: {
      id: true,
      commissionAttributionOrgId: true,
      commissionAttributionJoinedAt: true,
      membershipSubscription: {
        select: { id: true, stripeSubscriptionId: true, level: true, billingInterval: true },
      },
    },
  });
  if (!user?.membershipSubscription || !user.commissionAttributionOrgId || !user.commissionAttributionJoinedAt) {
    throw new Error(`Missing subscription/attribution for ${EMAIL}`);
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
    throw new Error("Org not found");
  }

  const { getStripe } = await import("../lib/stripe");
  const stripe = await getStripe();
  const invoices = await stripe.invoices.list({
    subscription: user.membershipSubscription.stripeSubscriptionId,
    limit: 5,
  });

  for (const invoice of invoices.data) {
    if (!invoice.id || invoice.status !== "paid") {
      continue;
    }
    await syncMembershipPaymentStripeFeeFromInvoice({
      stripeInvoiceId: invoice.id,
      fallbackAmountPaidCents: invoice.amount_paid ?? 0,
    });

    const payment = await prisma.membershipSubscriptionPayment.findUnique({
      where: { stripeInvoiceId: invoice.id },
    });
    if (!payment) {
      continue;
    }

    await prisma.orgCommissionLedgerEntry.deleteMany({ where: { stripeInvoiceId: invoice.id } });

    const rate = computeCommissionRateForPayment({
      org,
      attributionJoinedAt: user.commissionAttributionJoinedAt,
      paidAt: payment.paidAt,
    });
    const feePending = payment.commissionFeePending || payment.netCents == null;
    const commissionCents = feePending
      ? 0
      : computeCommissionCents(payment.netCents ?? 0, rate);

    await prisma.orgCommissionLedgerEntry.create({
      data: {
        organizationId: user.commissionAttributionOrgId,
        userId: user.id,
        stripeInvoiceId: invoice.id,
        level: payment.level ?? user.membershipSubscription.level,
        billingInterval: payment.billingInterval ?? user.membershipSubscription.billingInterval,
        amountPaidCents: payment.amountPaidCents,
        processingFeeCents: payment.processingFeeCents,
        netCents: payment.netCents,
        paymentCents: payment.amountPaidCents,
        commissionRate: rate,
        commissionCents,
        commissionFeePending: feePending,
        paidAt: payment.paidAt,
        isRefund: false,
      },
    });

    console.log(invoice.id, {
      amountPaidCents: payment.amountPaidCents,
      processingFeeCents: payment.processingFeeCents,
      netCents: payment.netCents,
      commissionCents,
      feePending,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
