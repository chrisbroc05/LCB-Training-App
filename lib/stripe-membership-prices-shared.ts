import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

const LEVEL_INTERVAL_PRICE_ENV: Record<
  MembershipLevelKey,
  Partial<Record<MembershipBillingIntervalKey, string>>
> = {
  CORE: {
    MONTHLY: "STRIPE_PRICE_CORE_MONTHLY",
    ANNUAL: "STRIPE_PRICE_CORE_ANNUAL",
  },
  PLUS: {
    MONTHLY: "STRIPE_PRICE_PLUS_MONTHLY",
    ANNUAL: "STRIPE_PRICE_PLUS_ANNUAL",
  },
  ALL_ACCESS: {
    MONTHLY: "STRIPE_PRICE_ALL_ACCESS_MONTHLY",
  },
};

export type MembershipPriceMapping = {
  level: MembershipLevelKey;
  interval: MembershipBillingIntervalKey;
};

function readConfiguredPriceId(envKey: string): string | null {
  const configured = process.env[envKey]?.trim();
  return configured || null;
}

export function resolveMembershipPriceEnvKey(
  level: MembershipLevelKey,
  interval: MembershipBillingIntervalKey,
): string | null {
  const envKey = LEVEL_INTERVAL_PRICE_ENV[level][interval];
  return envKey ?? null;
}

export function mapStripePriceIdToMembershipPrice(
  priceId: string | null | undefined,
): MembershipPriceMapping | null {
  const normalized = priceId?.trim();
  if (!normalized) {
    return null;
  }
  const entries = Object.entries(LEVEL_INTERVAL_PRICE_ENV) as Array<
    [MembershipLevelKey, Partial<Record<MembershipBillingIntervalKey, string>>]
  >;
  for (const [level, intervals] of entries) {
    for (const [interval, envKey] of Object.entries(intervals) as Array<
      [MembershipBillingIntervalKey, string]
    >) {
      const configured = readConfiguredPriceId(envKey);
      if (configured && configured === normalized) {
        return { level, interval };
      }
    }
  }
  return null;
}

export function mapStripePriceIdToMembershipLevel(
  priceId: string | null | undefined,
): MembershipLevelKey | null {
  return mapStripePriceIdToMembershipPrice(priceId)?.level ?? null;
}

export function mapStripePriceIdToBillingInterval(
  priceId: string | null | undefined,
): MembershipBillingIntervalKey | null {
  return mapStripePriceIdToMembershipPrice(priceId)?.interval ?? null;
}

export function isPhase2MembershipPriceId(priceId: string | null | undefined): boolean {
  return mapStripePriceIdToMembershipPrice(priceId) !== null;
}
