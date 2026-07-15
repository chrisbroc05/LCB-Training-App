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
    monthly: { primary: "$39/month" },
    annual: { primary: "$390/year", secondary: "just $32.50/mo" },
  },
  memorable: {
    monthly: { primary: "$119/month" },
    annual: { primary: "$1,190/year", secondary: "just $99.17/mo" },
  },
  elite: {
    monthly: { primary: "$179/month" },
    annual: { primary: "$1,790/year", secondary: "just $149.17/mo" },
  },
};

export function getTierPricing(tier: TierKey, billingFrequency: BillingFrequency): TierPricing {
  return tierPricing[tier][billingFrequency];
}

const annualSavingsByTier: Partial<Record<TierKey, number>> = {
  basic: 78,
  memorable: 238,
  elite: 358,
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
