import "server-only";

import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

export {
  isPhase2MembershipPriceId,
  mapStripePriceIdToBillingInterval,
  mapStripePriceIdToMembershipLevel,
  mapStripePriceIdToMembershipPrice,
  resolveMembershipPriceEnvKey,
} from "@/lib/stripe-membership-prices-shared";

import { resolveMembershipPriceEnvKey } from "@/lib/stripe-membership-prices-shared";

export function resolveMembershipLevelStripePriceId(
  level: MembershipLevelKey,
  interval: MembershipBillingIntervalKey = "MONTHLY",
): string | null {
  const envKey = resolveMembershipPriceEnvKey(level, interval);
  if (!envKey) {
    console.error(
      `[stripe-membership-prices] No price env for ${level} ${interval}.`,
    );
    return null;
  }
  const priceId = process.env[envKey]?.trim();
  if (!priceId) {
    console.error(
      `[stripe-membership-prices] Missing Stripe price for ${level} ${interval}. Set ${envKey}.`,
    );
    return null;
  }
  return priceId;
}

export function getMembershipLevelStripePriceId(
  level: MembershipLevelKey,
  interval: MembershipBillingIntervalKey = "MONTHLY",
): string {
  const priceId = resolveMembershipLevelStripePriceId(level, interval);
  if (!priceId) {
    throw new Error(`MEMBERSHIP_PRICE_NOT_CONFIGURED:${level}:${interval}`);
  }
  return priceId;
}
