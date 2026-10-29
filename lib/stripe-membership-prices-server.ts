import "server-only";

import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

export {
  isPhase2MembershipPriceId,
  mapStripePriceIdToMembershipLevel,
} from "@/lib/stripe-membership-prices-shared";

const LEVEL_PRICE_ENV: Record<MembershipLevelKey, string> = {
  CORE: "STRIPE_PRICE_CORE_MONTHLY",
  PLUS: "STRIPE_PRICE_PLUS_MONTHLY",
  ALL_ACCESS: "STRIPE_PRICE_ALL_ACCESS_MONTHLY",
};

export function resolveMembershipLevelStripePriceId(level: MembershipLevelKey): string | null {
  const envKey = LEVEL_PRICE_ENV[level];
  const priceId = process.env[envKey]?.trim();
  if (!priceId) {
    console.error(
      `[stripe-membership-prices] Missing Stripe price for ${level}. Set ${envKey}.`,
    );
    return null;
  }
  return priceId;
}

export function getMembershipLevelStripePriceId(level: MembershipLevelKey): string {
  const priceId = resolveMembershipLevelStripePriceId(level);
  if (!priceId) {
    throw new Error(`MEMBERSHIP_PRICE_NOT_CONFIGURED:${level}`);
  }
  return priceId;
}
