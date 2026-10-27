import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

const LEVEL_PRICE_ENV: Record<MembershipLevelKey, string> = {
  CORE: "STRIPE_PRICE_CORE_MONTHLY",
  PLUS: "STRIPE_PRICE_PLUS_MONTHLY",
  ALL_ACCESS: "STRIPE_PRICE_ALL_ACCESS_MONTHLY",
};

export function mapStripePriceIdToMembershipLevel(
  priceId: string | null | undefined,
): MembershipLevelKey | null {
  const normalized = priceId?.trim();
  if (!normalized) {
    return null;
  }
  const entries = Object.entries(LEVEL_PRICE_ENV) as Array<[MembershipLevelKey, string]>;
  for (const [level, envKey] of entries) {
    const configured = process.env[envKey]?.trim();
    if (configured && configured === normalized) {
      return level;
    }
  }
  return null;
}

export function isPhase2MembershipPriceId(priceId: string | null | undefined): boolean {
  return mapStripePriceIdToMembershipLevel(priceId) !== null;
}
