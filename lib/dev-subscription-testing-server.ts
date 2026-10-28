import "server-only";

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { expirePastDueMembershipGraceForUser } from "@/lib/membership-subscription-grace-server";
import {
  applyMembershipSubscriptionFromStripe,
} from "@/lib/membership-subscription-server";

const STRIPE_FAIL_PAYMENT_METHOD = "pm_card_chargeCustomerFail";
const STRIPE_FAIL_CARD_TOKEN = "tok_chargeCustomerFail";

export type DevSubscriptionSnapshot = {
  level: string;
  status: string;
  pastDueGraceEndsAt: string | null;
  accessEndedAt: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripeStatus: string | null;
};

export async function getDevSubscriptionSnapshot(userId: string): Promise<DevSubscriptionSnapshot | null> {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    return null;
  }

  let stripeStatus: string | null = null;
  try {
    const stripeSub = await getStripe().subscriptions.retrieve(sub.stripeSubscriptionId);
    stripeStatus = stripeSub.status;
  } catch {
    stripeStatus = null;
  }

  return {
    level: sub.level,
    status: sub.status,
    pastDueGraceEndsAt: sub.pastDueGraceEndsAt?.toISOString() ?? null,
    accessEndedAt: sub.accessEndedAt?.toISOString() ?? null,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    stripeCustomerId: sub.stripeCustomerId,
    stripeStatus,
  };
}

async function attachPaymentMethodToCustomer(
  stripe: Stripe,
  paymentMethodId: string,
  customerId: string,
) {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeError &&
      (error.code === "resource_already_exists" ||
        error.message.toLowerCase().includes("already been attached"))
    ) {
      return;
    }
    throw error;
  }
}

/** Prefer core3's existing 0341 card; otherwise attach Stripe's chargeCustomerFail test PM. */
async function ensureDefaultFailingPaymentMethod(stripe: Stripe, customerId: string): Promise<string> {
  const listed = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 20,
  });
  const existingDecline = listed.data.find((pm) => pm.card?.last4 === "0341");
  if (existingDecline) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: existingDecline.id },
    });
    return existingDecline.id;
  }

  let paymentMethodId = STRIPE_FAIL_PAYMENT_METHOD;
  try {
    await attachPaymentMethodToCustomer(stripe, STRIPE_FAIL_PAYMENT_METHOD, customerId);
  } catch {
    const created = await stripe.paymentMethods.create({
      type: "card",
      card: { token: STRIPE_FAIL_CARD_TOKEN },
    });
    await attachPaymentMethodToCustomer(stripe, created.id, customerId);
    paymentMethodId = created.id;
  }

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  return paymentMethodId;
}

/**
 * Dev-only: failed renewal via Stripe (failing PM + invoice pay), then sync from Stripe.
 * Matches invoice.payment_failed + customer.subscription.updated with status past_due.
 */
export async function simulateMembershipRenewalPaymentFailed(userId: string) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No MembershipSubscription row for this user.");
  }
  if (!sub.stripeCustomerId || !sub.stripeSubscriptionId) {
    throw new Error("MembershipSubscription is missing Stripe customer or subscription id.");
  }

  const stripe = getStripe();
  await ensureDefaultFailingPaymentMethod(stripe, sub.stripeCustomerId);

  let invoice = await stripe.invoices.create({
    customer: sub.stripeCustomerId,
    subscription: sub.stripeSubscriptionId,
  });
  invoice = await stripe.invoices.finalizeInvoice(invoice.id);

  try {
    await stripe.invoices.pay(invoice.id);
  } catch {
    /* expected when the default payment method declines */
  }

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  await applyMembershipSubscriptionFromStripe({
    userId,
    subscription: stripeSub,
  });

  const snapshot = await getDevSubscriptionSnapshot(userId);
  if (!snapshot) {
    throw new Error("MembershipSubscription row missing after Stripe simulate.");
  }
  if (snapshot.status !== "PAST_DUE") {
    throw new Error(
      `Expected MembershipSubscription PAST_DUE after failed renewal; got ${snapshot.status} (Stripe: ${snapshot.stripeStatus ?? "unknown"}).`,
    );
  }

  return snapshot;
}

/** Dev-only: end grace immediately (drop to base tier in app). Keeps MembershipSubscription row. */
export async function expireMembershipGraceNow(userId: string) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No MembershipSubscription row for this user.");
  }
  if (sub.status !== "PAST_DUE") {
    throw new Error(
      `Cannot expire grace: MembershipSubscription.status is ${sub.status}, not PAST_DUE.`,
    );
  }
  if (!sub.pastDueGraceEndsAt) {
    throw new Error("Cannot expire grace: pastDueGraceEndsAt is missing on MembershipSubscription.");
  }

  await prisma.membershipSubscription.update({
    where: { userId },
    data: { pastDueGraceEndsAt: new Date(0) },
  });

  const ok = await expirePastDueMembershipGraceForUser(userId, new Date());
  if (!ok) {
    throw new Error("Grace expiry did not run after forcing pastDueGraceEndsAt.");
  }

  return { success: true as const };
}
