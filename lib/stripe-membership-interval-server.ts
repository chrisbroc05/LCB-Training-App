import "server-only";

import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import { membershipLevelSupportsAnnualBilling } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  applyMembershipSubscriptionFromStripe,
  getSubscriptionPeriodEnd,
} from "@/lib/membership-subscription-server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { buildMembershipUpgradeStripeUpdateOptions } from "@/lib/membership-change-shared";
import { getMembershipLevelStripePriceId } from "@/lib/stripe-membership-prices-server";
import { resolveFoundingPlanChangeFlags } from "@/lib/founding-plan-change-shared";
import { buildStripeSubscriptionDiscountFields } from "@/lib/stripe-subscription-discount-shared";

export async function switchMembershipBillingInterval(
  userId: string,
  targetInterval: MembershipBillingIntervalKey,
) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }

  const level = sub.level as MembershipLevelKey;
  if (!membershipLevelSupportsAnnualBilling(level)) {
    throw new Error("This plan is monthly only.");
  }

  const currentInterval = (sub.billingInterval as MembershipBillingIntervalKey) ?? "MONTHLY";
  if (currentInterval === targetInterval) {
    throw new Error("You are already on this billing interval.");
  }

  const stripe = getStripe();
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const item = stripeSub.items.data[0];
  if (!item) {
    throw new Error("Subscription item missing.");
  }

  const newPriceId = getMembershipLevelStripePriceId(level, targetInterval);

  if (targetInterval === "ANNUAL") {
    const { foundingPriceEndsWithChange } = resolveFoundingPlanChangeFlags({
      subscription: sub,
      changeKind: "switch_to_annual",
    });
    const upgradeOptions = buildMembershipUpgradeStripeUpdateOptions();
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      ...upgradeOptions,
      items: [{ id: item.id, price: newPriceId }],
      ...buildStripeSubscriptionDiscountFields({
        clearExistingDiscounts: foundingPriceEndsWithChange,
        applyCouponId: null,
      }),
      metadata: {
        ...stripeSub.metadata,
        membershipLevel: level,
        billingInterval: targetInterval,
        foundingDiscountEndsAt: "",
      },
      expand: ["latest_invoice"],
    });
    await prisma.membershipSubscription.update({
      where: { userId },
      data: {
        pendingBillingInterval: null,
        foundingDiscountEndsAt: null,
        stripeScheduleId: null,
      },
    });
    await applyMembershipSubscriptionFromStripe({
      userId,
      subscription: updated,
      previousLevel: level,
    });
    return { immediate: true as const };
  }

  const periodEnd = getSubscriptionPeriodEnd(stripeSub);
  const currentPriceId = sub.stripePriceId ?? item.price.id;
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
      pendingBillingInterval: targetInterval,
      stripeScheduleId: updatedSchedule.id,
      pendingLevel: null,
    },
  });

  return { immediate: false as const, effectiveAt: periodEnd.toISOString() };
}

export async function cancelScheduledBillingIntervalSwitch(userId: string) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }
  if (!sub.pendingBillingInterval) {
    throw new Error("No scheduled billing change to cancel.");
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
      pendingBillingInterval: null,
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
