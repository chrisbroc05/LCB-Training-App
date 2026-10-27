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

export function getMembershipLevelStripePriceId(level: MembershipLevelKey): string {
  const envKey = LEVEL_PRICE_ENV[level];
  const priceId = process.env[envKey]?.trim();
  if (!priceId) {
    throw new Error(`Missing Stripe price for ${level}. Set ${envKey} in .env.`);
  }
  return priceId;
}
