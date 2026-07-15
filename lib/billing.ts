import type { DatabaseTier, TierKey } from "@/lib/membership";

export type BillingFrequency = "monthly" | "annual";

export function parseBillingFrequency(value: string | null | undefined): BillingFrequency {
  return value?.toLowerCase() === "annual" ? "annual" : "monthly";
}

export function isBillingFrequency(value: string | null | undefined): value is BillingFrequency {
  return value === "monthly" || value === "annual";
}

type TierPricing = {
  primary: string;
  secondary?: string;
};

const paidTierKeys: TierKey[] = ["basic", "memorable", "elite"];

export const tierPricing: Record<TierKey, Record<BillingFrequency, TierPricing>> = {
  free: {
    monthly: { primary: "$0" },
    annual: { primary: "$0" },
  },
  basic: {
    monthly: { primary: "$49/month" },
    annual: { primary: "$490/year", secondary: "just $40.83/mo" },
  },
  memorable: {
    monthly: { primary: "$149/month" },
    annual: { primary: "$1,490/year", secondary: "just $124.17/mo" },
  },
  elite: {
    monthly: { primary: "$249/month" },
    annual: { primary: "$2,490/year", secondary: "just $207.50/mo" },
  },
};

export function getTierPricing(tier: TierKey, billingFrequency: BillingFrequency): TierPricing {
  return tierPricing[tier][billingFrequency];
}

const annualSavingsByTier: Partial<Record<TierKey, number>> = {
  basic: 98,
  memorable: 298,
  elite: 498,
};

export function getAnnualSavings(tier: TierKey): number | null {
  return annualSavingsByTier[tier] ?? null;
}

export function formatTierPriceLabel(tier: TierKey, billingFrequency: BillingFrequency): string {
  const pricing = getTierPricing(tier, billingFrequency);
  if (pricing.secondary) {
    return `${pricing.primary} (${pricing.secondary})`;
  }
  return pricing.primary;
}

export function isPaidTierKey(tier: TierKey): tier is Exclude<TierKey, "free"> {
  return paidTierKeys.includes(tier);
}

export function isPaidDatabaseTier(tier: DatabaseTier): tier is Exclude<DatabaseTier, "FREE"> {
  return tier !== "FREE";
}
