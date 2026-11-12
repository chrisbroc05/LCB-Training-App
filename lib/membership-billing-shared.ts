import { EMAIL_REPLY_TO } from "@/lib/email-layout";
import { FOUNDING_PLUS_MONTHLY_DISCOUNT_DISPLAY } from "@/lib/founding-offer-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { MEMBERSHIP_LEVELS } from "@/lib/membership-levels-shared";

export type MembershipBillingIntervalKey = "MONTHLY" | "ANNUAL";

export function parseMembershipBillingInterval(
  value: string | null | undefined,
): MembershipBillingIntervalKey {
  const normalized = value?.trim().toUpperCase();
  return normalized === "ANNUAL" ? "ANNUAL" : "MONTHLY";
}

export function membershipLevelSupportsAnnualBilling(level: MembershipLevelKey): boolean {
  return level === "CORE" || level === "PLUS";
}

export function getMembershipLevelPriceDisplay(
  level: MembershipLevelKey,
  interval: MembershipBillingIntervalKey,
): string {
  if (level === "ALL_ACCESS") {
    return MEMBERSHIP_LEVELS.ALL_ACCESS.priceDisplay;
  }
  if (interval === "ANNUAL") {
    if (level === "CORE") {
      return "$100/yr (~$8.33/mo)";
    }
    if (level === "PLUS") {
      return "$200/yr (~$16.67/mo)";
    }
  }
  return MEMBERSHIP_LEVELS[level].priceDisplay;
}

/** Always-visible yearly savings copy (crawlers see the default monthly toggle state). */
export const MEMBERSHIP_YEARLY_SAVINGS_SUMMARY =
  "Yearly - 2 months free: Core $100/yr (~$8.33/mo), Plus $200/yr (~$16.67/mo).";

/** Recurring amount shown in transactional emails (no marketing suffix). */
export function getMembershipBilledPriceDisplay(params: {
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
  foundingPlusMonthlyActive?: boolean;
}): string {
  if (
    params.foundingPlusMonthlyActive &&
    params.level === "PLUS" &&
    params.billingInterval === "MONTHLY"
  ) {
    return FOUNDING_PLUS_MONTHLY_DISCOUNT_DISPLAY;
  }
  if (params.billingInterval === "ANNUAL") {
    if (params.level === "CORE") {
      return "$100/yr";
    }
    if (params.level === "PLUS") {
      return "$200/yr";
    }
  }
  return MEMBERSHIP_LEVELS[params.level].priceDisplay;
}

export function membershipLevelIncludesCoachMessaging(level: MembershipLevelKey): boolean {
  return level === "PLUS" || level === "ALL_ACCESS";
}

export function buildAnnualMembershipRefundPolicyMyPlanNote(params: {
  level: MembershipLevelKey;
  replyToEmail?: string;
}): string {
  const replyTo = params.replyToEmail?.trim() || EMAIL_REPLY_TO;
  const contact = membershipLevelIncludesCoachMessaging(params.level)
    ? "reply to your welcome email or message me in the app"
    : `reply to your welcome email or email me at ${replyTo}`;
  return `Annual memberships: full refund within 14 days of your annual payment. To request one, ${contact}. After 14 days, annual plans are non-refundable.`;
}

export const ANNUAL_MEMBERSHIP_REFUND_POLICY_SHORT =
  "Annual memberships: request a full refund within 14 days of your annual payment. After 14 days, annual plans are non-refundable.";

export const ANNUAL_MEMBERSHIP_REFUND_POLICY_TERMS =
  "Core and Plus annual memberships: you may request a full refund within 14 days of the annual payment date. After 14 days, annual plans are non-refundable. Monthly memberships follow the standard cancellation rules (access through the paid period, no partial refunds).";
