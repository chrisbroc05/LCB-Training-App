import type Stripe from "stripe";
import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  isMembershipPaymentFullyRefunded,
  resolveMembershipRefundAmountPaidCents,
} from "@/lib/membership-charge-refund-shared";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

async function findMembershipPaymentForCharge(charge: Stripe.Charge) {
  const byChargeId = await prisma.membershipSubscriptionPayment.findFirst({
    where: { stripeChargeId: charge.id },
  });
  if (byChargeId) {
    return byChargeId;
  }

  const chargeWithInvoice = charge as Stripe.Charge & {
    invoice?: string | Stripe.Invoice | null;
  };
  let invoiceId =
    typeof chargeWithInvoice.invoice === "string"
      ? chargeWithInvoice.invoice
      : chargeWithInvoice.invoice?.id ?? null;
  if (!invoiceId) {
    const retrieved = await getStripe().charges.retrieve(charge.id);
    const retrievedWithInvoice = retrieved as Stripe.Charge & {
      invoice?: string | Stripe.Invoice | null;
    };
    invoiceId =
      typeof retrievedWithInvoice.invoice === "string"
        ? retrievedWithInvoice.invoice
        : retrievedWithInvoice.invoice?.id ?? null;
  }
  if (invoiceId) {
    const byInvoice = await prisma.membershipSubscriptionPayment.findUnique({
      where: { stripeInvoiceId: invoiceId },
    });
    if (byInvoice) {
      return byInvoice;
    }
  }

  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (paymentIntentId) {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paymentIntentWithInvoice = paymentIntent as Stripe.PaymentIntent & {
      invoice?: string | Stripe.Invoice | null;
    };
    const piInvoice =
      typeof paymentIntentWithInvoice.invoice === "string"
        ? paymentIntentWithInvoice.invoice
        : paymentIntentWithInvoice.invoice?.id ?? null;
    if (piInvoice) {
      return prisma.membershipSubscriptionPayment.findUnique({
        where: { stripeInvoiceId: piInvoice },
      });
    }
  }

  return null;
}

export async function processMembershipSubscriptionChargeRefund(params: {
  charge: Stripe.Charge;
  refundedAt?: Date;
}) {
  const charge = params.charge;
  if (charge.amount_refunded <= 0) {
    return { processed: false as const, reason: "no_refund_amount" as const };
  }

  const payment = await findMembershipPaymentForCharge(charge);
  if (!payment) {
    return { processed: false as const, reason: "membership_payment_not_found" as const };
  }

  const refundAmountPaidCents = resolveMembershipRefundAmountPaidCents({
    chargeAmountRefundedCents: charge.amount_refunded,
    paymentAmountPaidCents: payment.amountPaidCents,
  });
  if (refundAmountPaidCents <= 0) {
    return { processed: false as const, reason: "zero_refund_amount" as const };
  }

  const refundedAt = params.refundedAt ?? new Date();
  const fullyRefunded = isMembershipPaymentFullyRefunded({
    chargeAmountRefundedCents: charge.amount_refunded,
    paymentAmountPaidCents: payment.amountPaidCents,
  });

  let userId = payment.userId;
  if (!userId && payment.membershipSubscriptionId) {
    const sub = await prisma.membershipSubscription.findUnique({
      where: { id: payment.membershipSubscriptionId },
      select: { userId: true },
    });
    userId = sub?.userId ?? null;
  }
  if (!userId) {
    return { processed: false as const, reason: "membership_user_missing" as const };
  }

  await prisma.membershipSubscriptionPayment.update({
    where: { id: payment.id },
    data: {
      userId,
      stripeChargeId: payment.stripeChargeId ?? charge.id,
      refundedAt: fullyRefunded ? refundedAt : payment.refundedAt,
    },
  });

  const { recordCommissionRefundForMembershipPayment } = await import(
    "@/lib/commission-ledger-server"
  );
  const ledger = await recordCommissionRefundForMembershipPayment({
    userId,
    stripeInvoiceId: payment.stripeInvoiceId,
    refundAmountPaidCents,
    paidAt: refundedAt,
    level: (payment.level as MembershipLevelKey | null) ?? null,
    billingInterval: (payment.billingInterval as MembershipBillingIntervalKey | null) ?? null,
  });

  if (!ledger.recorded && ledger.reason === "duplicate") {
    return { processed: true as const, reason: "already_recorded" as const, ledger };
  }
  if (!ledger.recorded) {
    return { processed: false as const, reason: ledger.reason, ledger };
  }

  return { processed: true as const, ledger, refundAmountPaidCents, fullyRefunded };
}
