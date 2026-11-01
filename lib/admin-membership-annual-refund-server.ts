import "server-only";

import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { listRefundableAnnualMembershipPayments } from "@/lib/membership-annual-refund-shared";
import {
  applyMembershipSubscriptionFromStripe,
  syncMembershipSubscriptionPaymentsFromStripe,
} from "@/lib/membership-subscription-server";
import { recordCommissionRefundForMembershipPayment } from "@/lib/commission-ledger-server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

async function refundStripeInvoice(invoiceId: string) {
  const stripe = getStripe();
  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ["payments.data.payment"],
  });

  const chargeIds = new Set<string>();
  const paymentIntentIds = new Set<string>();

  for (const row of invoice.payments?.data ?? []) {
    if (row.status !== "paid") {
      continue;
    }
    const payment = row.payment;
    if (payment.charge) {
      const chargeId =
        typeof payment.charge === "string" ? payment.charge : payment.charge.id;
      chargeIds.add(chargeId);
      continue;
    }
    const paymentIntentId =
      typeof payment.payment_intent === "string"
        ? payment.payment_intent
        : payment.payment_intent?.id;
    if (!paymentIntentId) {
      continue;
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const latestCharge = paymentIntent.latest_charge;
    if (typeof latestCharge === "string") {
      chargeIds.add(latestCharge);
    } else if (latestCharge?.id) {
      chargeIds.add(latestCharge.id);
    } else {
      paymentIntentIds.add(paymentIntentId);
    }
  }

  if (chargeIds.size === 0 && paymentIntentIds.size === 0) {
    throw new Error(`Could not find a charge to refund for invoice ${invoiceId}.`);
  }

  for (const chargeId of chargeIds) {
    await stripe.refunds.create({ charge: chargeId });
  }
  for (const paymentIntentId of paymentIntentIds) {
    await stripe.refunds.create({ payment_intent: paymentIntentId });
  }
}

export async function executeAdminAnnualMembershipRefund(userId: string) {
  const sub = await prisma.membershipSubscription.findUnique({
    where: { userId },
  });

  if (!sub) {
    throw new Error("No membership subscription found.");
  }

  if (sub.billingInterval !== "ANNUAL") {
    throw new Error("Annual refund applies only to annual billing.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  await syncMembershipSubscriptionPaymentsFromStripe({
    userId,
    stripeCustomerId: user?.stripeCustomerId ?? null,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    subscriptionBillingInterval: sub.billingInterval as MembershipBillingIntervalKey,
  });

  const payments = await prisma.membershipSubscriptionPayment.findMany({
    where: {
      OR: [{ userId }, { membershipSubscriptionId: sub.id }],
    },
    orderBy: { paidAt: "desc" },
  });

  const now = new Date();
  const refundable = listRefundableAnnualMembershipPayments(
    payments,
    now,
    sub.billingInterval,
  );
  if (refundable.length === 0) {
    throw new Error("No annual payments are eligible for refund.");
  }

  const stripe = getStripe();

  if (sub.stripeScheduleId) {
    try {
      await stripe.subscriptionSchedules.release(sub.stripeScheduleId);
    } catch {
      /* schedule may already be released */
    }
  }

  for (const payment of refundable) {
    await refundStripeInvoice(payment.stripeInvoiceId);
    await prisma.membershipSubscriptionPayment.update({
      where: { id: payment.id },
      data: { refundedAt: now },
    });

    const paymentUserId = payment.userId ?? userId;
    if (paymentUserId && payment.amountPaidCents > 0) {
      await recordCommissionRefundForMembershipPayment({
        userId: paymentUserId,
        stripeInvoiceId: payment.stripeInvoiceId,
        refundAmountPaidCents: payment.amountPaidCents,
        paidAt: now,
        level: (payment.level as MembershipLevelKey | null) ?? (sub.level as MembershipLevelKey),
        billingInterval: (payment.billingInterval as MembershipBillingIntervalKey | null) ?? "ANNUAL",
      });
    }
  }

  const canceled = await stripe.subscriptions.cancel(sub.stripeSubscriptionId);

  await prisma.membershipSubscription.update({
    where: { userId },
    data: {
      pendingLevel: null,
      pendingBillingInterval: null,
      stripeScheduleId: null,
    },
  });

  await applyMembershipSubscriptionFromStripe({
    userId,
    subscription: canceled,
    previousLevel: sub.level as MembershipLevelKey,
    forceDeleted: true,
  });

  return {
    refundedPaymentCount: refundable.length,
    refundedTotalCents: refundable.reduce((sum, payment) => sum + payment.amountPaidCents, 0),
  };
}
