import "server-only";

import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipBillingDate } from "@/lib/format-date";
import {
  buildCancelModalContent,
  buildDowngradeModalContent,
  buildUpgradeModalContent,
  formatUsdFromCents,
  type PlanChangeModalContent,
} from "@/lib/membership-change-shared";
import {
  isMembershipLevelDowngrade,
  isMembershipLevelUpgrade,
} from "@/lib/membership-subscription-shared";
import { getSubscriptionPeriodEnd } from "@/lib/membership-subscription-server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getMembershipLevelStripePriceId } from "@/lib/stripe-membership-prices-server";

export type PlanChangePreviewResult = PlanChangeModalContent & {
  targetLevel?: MembershipLevelKey;
};

export async function previewMembershipPlanChange(params: {
  userId: string;
  action: "upgrade" | "downgrade" | "cancel";
  targetLevel?: MembershipLevelKey;
}): Promise<PlanChangePreviewResult> {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId: params.userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }

  const current = sub.level as MembershipLevelKey;
  const periodEnd = sub.currentPeriodEnd;
  const nextBillingLabel = formatMembershipBillingDate(periodEnd);

  if (params.action === "cancel") {
    return {
      ...buildCancelModalContent({
        currentLevel: current,
        accessEndsLabel: nextBillingLabel,
      }),
    };
  }

  const targetLevel = params.targetLevel;
  if (!targetLevel) {
    throw new Error("Choose a plan level.");
  }

  if (params.action === "downgrade" || isMembershipLevelDowngrade(current, targetLevel)) {
    if (!isMembershipLevelDowngrade(current, targetLevel)) {
      throw new Error("Use upgrade preview for a higher plan.");
    }
    return {
      targetLevel,
      ...buildDowngradeModalContent({
        currentLevel: current,
        targetLevel,
        effectiveDateLabel: nextBillingLabel,
      }),
    };
  }

  if (params.action === "upgrade" || isMembershipLevelUpgrade(current, targetLevel)) {
    if (!isMembershipLevelUpgrade(current, targetLevel)) {
      throw new Error("Use downgrade preview for a lower plan.");
    }

    const stripe = getStripe();
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const item = stripeSub.items.data[0];
    if (!item) {
      throw new Error("Subscription item missing.");
    }

    const customerId =
      typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id;
    if (!customerId) {
      throw new Error("Stripe customer missing.");
    }

    const newPriceId = getMembershipLevelStripePriceId(targetLevel);
    const preview = await stripe.invoices.createPreview({
      customer: customerId,
      subscription: sub.stripeSubscriptionId,
      subscription_details: {
        items: [{ id: item.id, price: newPriceId }],
        proration_behavior: "always_invoice",
      },
    });

    const amountDueTodayDisplay = formatUsdFromCents(preview.amount_due ?? 0);
    const previewPeriodEnd = getSubscriptionPeriodEnd(stripeSub) ?? periodEnd;
    const billingLabel = formatMembershipBillingDate(previewPeriodEnd);

    return {
      targetLevel,
      ...buildUpgradeModalContent({
        targetLevel,
        amountDueTodayDisplay,
        nextBillingLabel: billingLabel,
      }),
    };
  }

  throw new Error("You are already on this plan.");
}
