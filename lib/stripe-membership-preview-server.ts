import "server-only";

import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import { parseMembershipBillingInterval } from "@/lib/membership-billing-shared";
import { resolveFoundingOfferForUserCheckout } from "@/lib/founding-offer-server";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipBillingDate } from "@/lib/format-date";
import {
  buildCancelModalContent,
  buildDowngradeModalContent,
  buildSwitchToAnnualModalContent,
  buildSwitchToMonthlyModalContent,
  buildUpgradeModalContent,
  formatUsdFromCents,
  type PlanChangeModalContent,
} from "@/lib/membership-change-shared";
import { resolveFoundingPlanChangeFlags } from "@/lib/founding-plan-change-shared";
import {
  isMembershipLevelDowngrade,
  isMembershipLevelUpgrade,
} from "@/lib/membership-subscription-shared";
import { getSubscriptionPeriodEnd } from "@/lib/membership-subscription-server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { buildStripeSubscriptionDiscountFields } from "@/lib/stripe-subscription-discount-shared";
import { getMembershipLevelStripePriceId } from "@/lib/stripe-membership-prices-server";

export type PlanChangePreviewResult = PlanChangeModalContent & {
  targetLevel?: MembershipLevelKey;
  amountDueTodayCents?: number;
  nextInvoiceAmountCents?: number;
};

function buildInvoicePreviewSubscriptionDetails(params: {
  itemId: string;
  newPriceId: string;
  clearFoundingDiscount: boolean;
}) {
  return {
    items: [{ id: params.itemId, price: params.newPriceId }],
    proration_behavior: "always_invoice" as const,
    ...buildStripeSubscriptionDiscountFields({
      clearExistingDiscounts: params.clearFoundingDiscount,
      applyCouponId: null,
    }),
  };
}

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
  const billingInterval = parseMembershipBillingInterval(sub.billingInterval);
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
    const { foundingPriceEndsWithChange } = resolveFoundingPlanChangeFlags({
      subscription: sub,
      changeKind: "downgrade",
      targetLevel,
    });
    return {
      targetLevel,
      ...buildDowngradeModalContent({
        currentLevel: current,
        targetLevel,
        effectiveDateLabel: nextBillingLabel,
        billingInterval,
        foundingPriceEndsWithChange,
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

    const newPriceId = getMembershipLevelStripePriceId(targetLevel, billingInterval);
    const { foundingPriceEndsWithChange } = resolveFoundingPlanChangeFlags({
      subscription: sub,
      changeKind: "upgrade",
      targetLevel,
    });
    const founding = await resolveFoundingOfferForUserCheckout({
      userId: params.userId,
      organizationId: sub.organizationId,
      level: targetLevel,
      billingInterval,
    });
    const preview = await stripe.invoices.createPreview({
      customer: customerId,
      subscription: sub.stripeSubscriptionId,
      subscription_details: buildInvoicePreviewSubscriptionDetails({
        itemId: item.id,
        newPriceId,
        clearFoundingDiscount: foundingPriceEndsWithChange,
      }),
    });

    const amountDueTodayCents = preview.amount_due ?? 0;
    const amountDueTodayDisplay = formatUsdFromCents(amountDueTodayCents);
    const previewPeriodEnd = getSubscriptionPeriodEnd(stripeSub) ?? periodEnd;
    const billingLabel = formatMembershipBillingDate(previewPeriodEnd);

    return {
      targetLevel,
      amountDueTodayCents,
      ...buildUpgradeModalContent({
        targetLevel,
        amountDueTodayDisplay,
        nextBillingLabel: billingLabel,
        billingInterval,
        foundingPlusMonthlyActive: founding.applyCoupon,
        foundingPriceEndsWithChange,
      }),
    };
  }

  throw new Error("You are already on this plan.");
}

export async function previewMembershipBillingIntervalSwitch(params: {
  userId: string;
  targetInterval: MembershipBillingIntervalKey;
}): Promise<PlanChangePreviewResult> {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId: params.userId } });
  if (!sub) {
    throw new Error("No active membership subscription.");
  }

  const level = sub.level as MembershipLevelKey;
  const currentInterval = parseMembershipBillingInterval(sub.billingInterval);
  if (currentInterval === params.targetInterval) {
    throw new Error("You are already on this billing interval.");
  }

  const throughLabel = formatMembershipBillingDate(sub.currentPeriodEnd);

  if (params.targetInterval === "MONTHLY") {
    const { foundingPriceEndsWithChange } = resolveFoundingPlanChangeFlags({
      subscription: sub,
      changeKind: "switch_to_monthly",
    });
    return buildSwitchToMonthlyModalContent({
      level,
      annualThroughDateLabel: throughLabel,
      foundingPriceEndsWithChange,
    });
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

  const newPriceId = getMembershipLevelStripePriceId(level, "ANNUAL");
  const { foundingPriceEndsWithChange } = resolveFoundingPlanChangeFlags({
    subscription: sub,
    changeKind: "switch_to_annual",
  });
  const preview = await stripe.invoices.createPreview({
    customer: customerId,
    subscription: sub.stripeSubscriptionId,
    subscription_details: buildInvoicePreviewSubscriptionDetails({
      itemId: item.id,
      newPriceId,
      clearFoundingDiscount: foundingPriceEndsWithChange,
    }),
  });

  const amountDueTodayCents = preview.amount_due ?? 0;

  return {
    amountDueTodayCents,
    ...buildSwitchToAnnualModalContent({
      level,
      amountDueTodayDisplay: formatUsdFromCents(amountDueTodayCents),
      foundingPriceEndsWithChange,
    }),
  };
}
