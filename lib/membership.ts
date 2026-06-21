export type TierKey = "free" | "basic" | "pro" | "elite";
export type DatabaseTier = "FREE" | "BASIC" | "PRO" | "ELITE";

export type MembershipTier = {
  key: TierKey;
  name: string;
  priceLabel: string;
  summary: string;
  features: string[];
};

export const membershipTiers: MembershipTier[] = [
  {
    key: "free",
    name: "Free",
    priceLabel: "$0 / month",
    summary: "One free submission total: swing analysis or mental game support.",
    features: [
      "One total free submission (swing or mental game)",
      "No drill library access",
      "No mindset library access",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    priceLabel: "$5 / month",
    summary: "Full hitting, fielding, and mindset video libraries.",
    features: [
      "Full hitting video library",
      "Full fielding video library",
      "Mindset video library",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "$15 / month",
    summary: "Everything in Basic plus weekly swing analysis and mental game support.",
    features: [
      "Everything in Basic",
      "Weekly swing analysis submission",
      "Mental game support form",
    ],
  },
  {
    key: "elite",
    name: "Elite",
    priceLabel: "$25 / month",
    summary: "Everything in Pro plus priority feedback and monthly group call access.",
    features: [
      "Everything in Pro",
      "Priority feedback on swing submissions",
      "Priority feedback on mental game submissions",
      "Monthly live group calls",
    ],
  },
];

export const tierRank: Record<TierKey, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  elite: 3,
};

export const keyToDatabaseTier: Record<TierKey, DatabaseTier> = {
  free: "FREE",
  basic: "BASIC",
  pro: "PRO",
  elite: "ELITE",
};

export const databaseTierToKey: Record<DatabaseTier, TierKey> = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
  ELITE: "elite",
};

export const validDatabaseTiers: DatabaseTier[] = ["FREE", "BASIC", "PRO", "ELITE"];

export function isDatabaseTier(value: string): value is DatabaseTier {
  return validDatabaseTiers.includes(value as DatabaseTier);
}

export function hasTierAccess(userTier: TierKey, requiredTier: TierKey) {
  return tierRank[userTier] >= tierRank[requiredTier];
}

export function hasDatabaseTierAccess(userTier: DatabaseTier, requiredTier: TierKey) {
  return hasTierAccess(databaseTierToKey[userTier], requiredTier);
}
