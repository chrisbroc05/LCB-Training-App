import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  mapStripePriceIdToMembershipPrice,
  type MembershipPriceMapping,
} from "@/lib/stripe-membership-prices-shared";
import { computeAnnualRefundEligibleUntil } from "@/lib/membership-annual-refund-shared";

export type MembershipInvoiceLineLike = {
  amount?: number | null;
  priceId?: string | null;
};

export type MembershipInvoicePaymentInput = {
  amountPaid: number;
  billingReason?: string | null;
  lines: MembershipInvoiceLineLike[];
  subscriptionBillingInterval?: MembershipBillingIntervalKey | null;
};

const SUBSCRIPTION_MEMBERSHIP_BILLING_REASONS = new Set([
  "subscription_create",
  "subscription_cycle",
  "subscription_update",
  "subscription",
]);

export function isSubscriptionMembershipInvoiceBillingReason(
  billingReason: string | null | undefined,
): boolean {
  if (!billingReason) {
    return false;
  }
  return SUBSCRIPTION_MEMBERSHIP_BILLING_REASONS.has(billingReason);
}

export function mapMembershipPriceFromInvoiceLines(
  lines: MembershipInvoiceLineLike[],
): MembershipPriceMapping | null {
  let best: { mapping: MembershipPriceMapping; amount: number } | null = null;
  for (const line of lines) {
    const priceId = line.priceId?.trim();
    if (!priceId) {
      continue;
    }
    const mapping = mapStripePriceIdToMembershipPrice(priceId);
    if (!mapping) {
      continue;
    }
    const amount = line.amount ?? 0;
    if (!best || amount > best.amount) {
      best = { mapping, amount };
    }
  }
  return best?.mapping ?? null;
}

export function lineMappingsIncludeAnnual(lines: MembershipInvoiceLineLike[]): boolean {
  for (const line of lines) {
    const mapping = mapStripePriceIdToMembershipPrice(line.priceId);
    if (mapping?.interval === "ANNUAL") {
      return true;
    }
  }
  return false;
}

export function resolveMembershipInvoicePayment(
  input: MembershipInvoicePaymentInput,
): {
  level: MembershipLevelKey | null;
  billingInterval: MembershipBillingIntervalKey | null;
  annualRefundEligibleUntil: Date | null;
} {
  const mapped = mapMembershipPriceFromInvoiceLines(input.lines);
  const hasAnnualLine = lineMappingsIncludeAnnual(input.lines);
  const subscriptionInterval = input.subscriptionBillingInterval ?? null;

  let billingInterval: MembershipBillingIntervalKey | null = mapped?.interval ?? null;

  if (hasAnnualLine) {
    billingInterval = "ANNUAL";
  } else if (
    subscriptionInterval === "ANNUAL" &&
    input.amountPaid > 0 &&
    isSubscriptionMembershipInvoiceBillingReason(input.billingReason)
  ) {
    billingInterval = "ANNUAL";
  } else if (!billingInterval && subscriptionInterval) {
    billingInterval = subscriptionInterval;
  }

  const level = mapped?.level ?? null;

  return {
    level,
    billingInterval,
    annualRefundEligibleUntil: null,
  };
}

/** Paid-at aware variant for persisting invoice rows. */
export function resolveMembershipInvoicePaymentForPaidInvoice(
  input: MembershipInvoicePaymentInput & { paidAt: Date },
): {
  level: MembershipLevelKey | null;
  billingInterval: MembershipBillingIntervalKey | null;
  annualRefundEligibleUntil: Date | null;
} {
  const resolved = resolveMembershipInvoicePayment(input);
  const annualRefundEligibleUntil =
    resolved.billingInterval === "ANNUAL"
      ? computeAnnualRefundEligibleUntil(input.paidAt)
      : null;
  return { ...resolved, annualRefundEligibleUntil };
}
