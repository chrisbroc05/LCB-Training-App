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

const paidTierKeys: TierKey[] = ["basic", "pro", "elite"];

export const tierPricing: Record<TierKey, Record<BillingFrequency, TierPricing>> = {
  free: {
    monthly: { primary: "$0" },
    annual: { primary: "$0" },
  },
  basic: {
    monthly: { primary: "$5/month" },
    annual: { primary: "$50/year", secondary: "just $4.17/mo" },
  },
  pro: {
    monthly: { primary: "$9/month" },
    annual: { primary: "$90/year", secondary: "just $7.50/mo" },
  },
  elite: {
    monthly: { primary: "$14/month" },
    annual: { primary: "$140/year", secondary: "just $11.67/mo" },
  },
};

export function getTierPricing(tier: TierKey, billingFrequency: BillingFrequency): TierPricing {
  return tierPricing[tier][billingFrequency];
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
