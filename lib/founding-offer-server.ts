import "server-only";

import { shouldApplyFoundingPlusMonthlyOffer } from "@/lib/founding-offer-shared";
import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { prisma } from "@/lib/prisma";

export function getFoundingPlusCouponId(): string | null {
  const id = process.env.STRIPE_COUPON_FOUNDING_PLUS?.trim();
  return id || null;
}

export async function resolveFoundingOfferForUserCheckout(params: {
  userId: string;
  organizationId: string | null | undefined;
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
}) {
  if (!params.organizationId) {
    return { applyCoupon: false as const, couponId: null, foundingDiscountEndsAt: null };
  }
  const org = await prisma.organization.findUnique({
    where: { id: params.organizationId },
    select: {
      foundingOfferEnabled: true,
      foundingOfferDeadline: true,
      foundingOfferMonths: true,
    },
  });
  if (
    !shouldApplyFoundingPlusMonthlyOffer({
      level: params.level,
      billingInterval: params.billingInterval,
      org,
    })
  ) {
    return { applyCoupon: false as const, couponId: null, foundingDiscountEndsAt: null };
  }
  const couponId = getFoundingPlusCouponId();
  if (!couponId) {
    console.error("[founding-offer] STRIPE_COUPON_FOUNDING_PLUS is not configured.");
    return { applyCoupon: false as const, couponId: null, foundingDiscountEndsAt: null };
  }
  const now = new Date();
  const months = org?.foundingOfferMonths ?? 12;
  const foundingDiscountEndsAt = new Date(now);
  foundingDiscountEndsAt.setUTCMonth(foundingDiscountEndsAt.getUTCMonth() + months);
  return { applyCoupon: true as const, couponId, foundingDiscountEndsAt };
}
