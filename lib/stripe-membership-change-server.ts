import "server-only";

import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  compareMembershipLevels,
  isMembershipLevelDowngrade,
  isMembershipLevelUpgrade,
} from "@/lib/membership-subscription-shared";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  buildMembershipUpgradeStripeUpdateOptions,
  formatMembershipUpgradePaymentError,
  shouldApplyMembershipLevelUpgrade,
} from "@/lib/membership-change-shared";
import {
  applyMembershipSubscriptionFromStripe,
  getSubscriptionPeriodEnd,
} from "@/lib/membership-subscription-server";
import { getMembershipLevelStripePriceId } from "@/lib/stripe-membership-prices-server";
import { undoUserScheduledSubscriptionCancellation } from "@/lib/stripe-membership-lifecycle-server";
import Stripe from "stripe";

export async function upgradeMembershipLevel(userId: string, targetLevel: MembershipLevelKey) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }

  const current = sub.level as MembershipLevelKey;
  if (!isMembershipLevelUpgrade(current, targetLevel)) {
    throw new Error("Target level must be higher than your current plan.");
  }

  if (targetLevel === "ALL_ACCESS") {
    const { isAllAccessCheckoutAvailable } = await import("@/lib/membership-subscription-server");
    const available = await isAllAccessCheckoutAvailable();
    if (!available) {
      throw new Error("ALL_ACCESS_CAP_FULL");
    }
  }

  const stripe = getStripe();
  if (sub.stripeScheduleId) {
    try {
      await stripe.subscriptionSchedules.release(sub.stripeScheduleId);
    } catch {
      /* schedule may already be released */
    }
  }

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const item = stripeSub.items.data[0];
  if (!item) {
    throw new Error("Subscription item missing.");
  }

  const newPriceId = getMembershipLevelStripePriceId(targetLevel);
  const upgradeOptions = buildMembershipUpgradeStripeUpdateOptions();

  let updated: Stripe.Subscription;
  try {
    updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      ...upgradeOptions,
      items: [{ id: item.id, price: newPriceId }],
      metadata: {
        ...stripeSub.metadata,
        membershipLevel: targetLevel,
      },
      expand: ["latest_invoice"],
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(formatMembershipUpgradePaymentError(current));
    }
    throw error;
  }

  const latestInvoice =
    updated.latest_invoice && typeof updated.latest_invoice !== "string"
      ? updated.latest_invoice
      : null;
  const latestInvoiceStatus = latestInvoice?.status ?? null;

  if (
    !shouldApplyMembershipLevelUpgrade({
      stripeSubscriptionStatus: updated.status,
      latestInvoiceStatus,
    })
  ) {
    throw new Error(formatMembershipUpgradePaymentError(current));
  }

  await prisma.membershipSubscription.update({
    where: { userId },
    data: {
      pendingLevel: null,
      stripeScheduleId: null,
      cancelAtPeriodEnd: false,
    },
  });

  await applyMembershipSubscriptionFromStripe({
    userId,
    subscription: updated,
    previousLevel: current,
  });
}

/**
 * Downgrades at period end via Stripe Subscription Schedules (Stripe applies the new price on renewal).
 */
export async function scheduleMembershipDowngrade(userId: string, targetLevel: MembershipLevelKey) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }

  const current = sub.level as MembershipLevelKey;
  if (!isMembershipLevelDowngrade(current, targetLevel)) {
    throw new Error("Target level must be lower than your current plan.");
  }
  if (compareMembershipLevels(current, targetLevel) === 0) {
    throw new Error("You are already on this plan.");
  }

  const stripe = getStripe();
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const periodEnd = getSubscriptionPeriodEnd(stripeSub);
  const currentPriceId = sub.stripePriceId ?? stripeSub.items.data[0]?.price.id;
  if (!periodEnd || !currentPriceId) {
    throw new Error("Unable to read billing period.");
  }

  if (sub.stripeScheduleId) {
    try {
      await stripe.subscriptionSchedules.release(sub.stripeScheduleId);
    } catch {
      /* ignore */
    }
  }

  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: sub.stripeSubscriptionId,
  });

  const phase0 = schedule.phases[0];
  if (!phase0) {
    throw new Error("Stripe schedule missing initial phase.");
  }

  const periodEndUnix = Math.floor(periodEnd.getTime() / 1000);
  const newPriceId = getMembershipLevelStripePriceId(targetLevel);
  const updatedSchedule = await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: currentPriceId, quantity: 1 }],
        start_date: phase0.start_date,
        end_date: periodEndUnix,
        proration_behavior: "none",
      },
      {
        items: [{ price: newPriceId, quantity: 1 }],
        start_date: periodEndUnix,
        proration_behavior: "none",
      },
    ],
  });

  await prisma.membershipSubscription.update({
    where: { userId },
    data: {
      pendingLevel: targetLevel,
      stripeScheduleId: updatedSchedule.id,
      cancelAtPeriodEnd: false,
    },
  });

  return { effectiveAt: periodEnd.toISOString(), pendingLevel: targetLevel };
}

export async function releaseScheduledMembershipDowngrade(userId: string) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }
  if (!sub.pendingLevel && !sub.stripeScheduleId) {
    throw new Error("No scheduled plan change to cancel.");
  }

  const stripe = getStripe();
  if (sub.stripeScheduleId) {
    try {
      await stripe.subscriptionSchedules.release(sub.stripeScheduleId);
    } catch {
      /* schedule may already be released */
    }
  }

  await prisma.membershipSubscription.update({
    where: { userId },
    data: {
      pendingLevel: null,
      stripeScheduleId: null,
    },
  });

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  await applyMembershipSubscriptionFromStripe({
    userId,
    subscription: stripeSub,
    previousLevel: sub.level as MembershipLevelKey,
  });
}

export async function resumeMembershipAfterScheduledCancel(userId: string) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }
  if (!sub.cancelAtPeriodEnd) {
    throw new Error("Your membership is not scheduled to cancel.");
  }

  const stripe = getStripe();
  if (sub.stripeScheduleId) {
    try {
      await stripe.subscriptionSchedules.release(sub.stripeScheduleId);
    } catch {
      /* ignore */
    }
  }

  const updated = await undoUserScheduledSubscriptionCancellation(sub.stripeSubscriptionId);

  await prisma.membershipSubscription.update({
    where: { userId },
    data: {
      pendingLevel: null,
      stripeScheduleId: null,
      cancelAtPeriodEnd: false,
    },
  });

  await applyMembershipSubscriptionFromStripe({
    userId,
    subscription: updated,
    previousLevel: sub.level as MembershipLevelKey,
  });
}

export async function cancelMembershipAtPeriodEnd(userId: string) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }

  const stripe = getStripe();
  if (sub.stripeScheduleId) {
    try {
      await stripe.subscriptionSchedules.release(sub.stripeScheduleId);
    } catch {
      /* ignore */
    }
  }

  const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.membershipSubscription.update({
    where: { userId },
    data: {
      pendingLevel: null,
      stripeScheduleId: null,
    },
  });

  await applyMembershipSubscriptionFromStripe({
    userId,
    subscription: updated,
    previousLevel: sub.level as MembershipLevelKey,
  });
}
