import "server-only";

import type { MembershipTier } from "@prisma/client";
import Stripe from "stripe";
import { sendCoachRefundProcessedPush } from "@/lib/coach-push-instant";
import type { DatabaseTier } from "@/lib/membership";
import { sendCoachRefundProcessedNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { StripeRefundProduct } from "@/lib/stripe-refund-shared";
import { stripe } from "@/lib/stripe";

type ResolvedPurchase = {
  userId: string;
  product: StripeRefundProduct;
  membershipTier: "TWELVE_WEEK" | "BASIC";
};

function isTwelveWeekPriceId(priceId: string | null | undefined) {
  return Boolean(priceId && priceId === process.env.TWELVE_WEEK_PROGRAM_PRICE_ID);
}

function isPlaybookPriceId(priceId: string | null | undefined) {
  return Boolean(priceId && priceId === process.env.STRIPE_BASIC_PRICE_ID);
}

function resolveProductFromMetadata(metadata: Stripe.Metadata | null | undefined): ResolvedPurchase | null {
  const userId = metadata?.userId?.trim();
  if (!userId) {
    return null;
  }

  const purchaseType = metadata?.purchaseType?.trim();
  if (purchaseType === "twelve_week_program") {
    return { userId, product: "twelve_week_program", membershipTier: "TWELVE_WEEK" };
  }

  if (purchaseType === "playbook") {
    return { userId, product: "playbook", membershipTier: "BASIC" };
  }

  const membershipTier = metadata?.membershipTier?.trim();
  if (membershipTier === "TWELVE_WEEK") {
    return { userId, product: "twelve_week_program", membershipTier: "TWELVE_WEEK" };
  }

  if (membershipTier === "BASIC") {
    return { userId, product: "playbook", membershipTier: "BASIC" };
  }

  return null;
}

async function resolvePurchaseFromPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const fromMetadata = resolveProductFromMetadata(paymentIntent.metadata);
  if (fromMetadata) {
    return fromMetadata;
  }

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  const session = sessions.data[0];
  if (!session) {
    return null;
  }

  return resolveProductFromMetadata(session.metadata);
}

async function resolvePurchaseFromCustomer(
  customerId: string,
  charge: Stripe.Charge,
): Promise<ResolvedPurchase | null> {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: {
      id: true,
      membershipTier: true,
      stripePriceId: true,
    },
  });

  if (!user) {
    return null;
  }

  if (isTwelveWeekPriceId(user.stripePriceId) || user.membershipTier === "TWELVE_WEEK") {
    return {
      userId: user.id,
      product: "twelve_week_program",
      membershipTier: "TWELVE_WEEK",
    };
  }

  if (isPlaybookPriceId(user.stripePriceId) || user.membershipTier === "BASIC") {
    return {
      userId: user.id,
      product: "playbook",
      membershipTier: "BASIC",
    };
  }

  if (charge.amount === 0) {
    return null;
  }

  return null;
}

async function resolveChargePurchase(charge: Stripe.Charge): Promise<ResolvedPurchase | null> {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

  if (paymentIntentId) {
    const resolved = await resolvePurchaseFromPaymentIntent(paymentIntentId);
    if (resolved) {
      return resolved;
    }
  }

  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (customerId) {
    return resolvePurchaseFromCustomer(customerId, charge);
  }

  return null;
}

function getRestoredMembershipTier(
  currentTier: MembershipTier,
  beforeProgramTier: MembershipTier | null,
): DatabaseTier {
  if (currentTier !== "TWELVE_WEEK") {
    return currentTier as DatabaseTier;
  }

  if (beforeProgramTier && beforeProgramTier !== "TWELVE_WEEK") {
    return beforeProgramTier as DatabaseTier;
  }

  return "FREE";
}

async function notifyCoachRefund(params: {
  chargeId: string;
  playerName: string;
  playerEmail: string;
}) {
  const name = params.playerName.trim() || params.playerEmail;
  const dedupeKey = `coach:COACH_REFUND_PROCESSED:${params.chargeId}`;

  await Promise.all([
    sendCoachRefundProcessedNotification({ playerName: name }),
    sendCoachRefundProcessedPush({
      chargeId: params.chargeId,
      playerName: name,
      dedupeKey,
    }),
  ]);
}

async function processTwelveWeekProgramRefund(params: {
  userId: string;
  chargeId: string;
  refundAmountCents: number;
  currency: string;
  refundedAt: Date;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      membershipTier: true,
      membershipTierBeforeProgram: true,
      programEnrollment: {
        select: {
          id: true,
          status: true,
          stripeRefundChargeId: true,
        },
      },
    },
  });

  if (!user) {
    return { processed: false, reason: "user_not_found" as const };
  }

  const enrollment = user.programEnrollment;
  const alreadyProcessed =
    enrollment?.status === "REFUNDED" && enrollment.stripeRefundChargeId === params.chargeId;

  if (alreadyProcessed) {
    await prisma.programEnrollment.update({
      where: { id: enrollment!.id },
      data: {
        refundAmountCents: params.refundAmountCents,
        refundedAt: params.refundedAt,
      },
    });
    return { processed: false, reason: "already_processed" as const };
  }

  const restoredTier = getRestoredMembershipTier(
    user.membershipTier,
    user.membershipTierBeforeProgram,
  );

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        membershipTier: restoredTier,
        membershipTierBeforeProgram: null,
        marketingEmailsSuppressed: true,
        twelveWeekProgramStartedAt: null,
        twelveWeekProgramEndsAt: null,
        stripePriceId: user.membershipTier === "TWELVE_WEEK" ? null : undefined,
        pendingCheckoutTier: null,
      },
    });

    if (enrollment) {
      await tx.programEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "REFUNDED",
          refundedAt: params.refundedAt,
          refundAmountCents: params.refundAmountCents,
          stripeRefundChargeId: params.chargeId,
          dailyRoutineEmailsEnabled: false,
          parentEmailsEnabled: false,
        },
      });
    } else {
      await tx.programEnrollment.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          status: "REFUNDED",
          refundedAt: params.refundedAt,
          refundAmountCents: params.refundAmountCents,
          stripeRefundChargeId: params.chargeId,
          dailyRoutineEmailsEnabled: false,
          parentEmailsEnabled: false,
        },
        update: {
          status: "REFUNDED",
          refundedAt: params.refundedAt,
          refundAmountCents: params.refundAmountCents,
          stripeRefundChargeId: params.chargeId,
          dailyRoutineEmailsEnabled: false,
          parentEmailsEnabled: false,
        },
      });
    }
  });

  await notifyCoachRefund({
    chargeId: params.chargeId,
    playerName: user.name ?? "",
    playerEmail: user.email,
  });

  return { processed: true as const };
}

async function processPlaybookRefund(params: {
  userId: string;
  chargeId: string;
  refundAmountCents: number;
  currency: string;
  refundedAt: Date;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      membershipTier: true,
    },
  });

  if (!user) {
    return { processed: false, reason: "user_not_found" as const };
  }

  if (user.membershipTier === "TWELVE_WEEK") {
    return { processed: false, reason: "playbook_included_in_program" as const };
  }

  if (user.membershipTier !== "BASIC") {
    return { processed: false, reason: "not_playbook_member" as const };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      membershipTier: "FREE",
      marketingEmailsSuppressed: true,
      stripePriceId: null,
      pendingCheckoutTier: null,
    },
  });

  await notifyCoachRefund({
    chargeId: params.chargeId,
    playerName: user.name ?? "",
    playerEmail: user.email,
  });

  return { processed: true as const };
}

export async function processStripeChargeRefund(charge: Stripe.Charge) {
  if (charge.amount_refunded <= 0) {
    return { processed: false, reason: "no_refund_amount" as const };
  }

  const purchase = await resolveChargePurchase(charge);
  if (!purchase) {
    return { processed: false, reason: "purchase_not_recognized" as const };
  }

  const refundedAt = new Date();
  const refundParams = {
    userId: purchase.userId,
    chargeId: charge.id,
    refundAmountCents: charge.amount_refunded,
    currency: charge.currency,
    refundedAt,
  };

  if (purchase.product === "twelve_week_program") {
    return processTwelveWeekProgramRefund(refundParams);
  }

  return processPlaybookRefund(refundParams);
}
