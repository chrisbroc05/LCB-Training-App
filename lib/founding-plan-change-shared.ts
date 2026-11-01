import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  isActiveFoundingPlusMonthlyMember,
  shouldEndFoundingPlusMonthlyOnPlanChange,
} from "@/lib/founding-offer-shared";

export type MembershipSubscriptionFoundingFields = {
  level: string;
  billingInterval: string | null;
  foundingDiscountEndsAt: Date | null;
};

export function resolveFoundingPlanChangeFlags(params: {
  subscription: MembershipSubscriptionFoundingFields;
  changeKind: "upgrade" | "downgrade" | "switch_to_annual" | "switch_to_monthly";
  targetLevel?: MembershipLevelKey;
  now?: Date;
}) {
  const foundingActive = isActiveFoundingPlusMonthlyMember({
    level: params.subscription.level,
    billingInterval: params.subscription.billingInterval,
    foundingDiscountEndsAt: params.subscription.foundingDiscountEndsAt,
    now: params.now,
  });
  const foundingPriceEndsWithChange = shouldEndFoundingPlusMonthlyOnPlanChange({
    foundingActive,
    changeKind: params.changeKind,
    targetLevel: params.targetLevel,
  });
  return { foundingActive, foundingPriceEndsWithChange };
}

export function parseSubscriptionBillingInterval(
  value: string | null | undefined,
): MembershipBillingIntervalKey {
  return value === "ANNUAL" ? "ANNUAL" : "MONTHLY";
}
