export type TierKey = "basic" | "pro" | "elite";
export type DatabaseTier = "BASIC" | "PRO" | "ELITE";

export type MembershipTier = {
  key: TierKey;
  name: string;
  priceLabel: string;
  summary: string;
  features: string[];
};

export const membershipTiers: MembershipTier[] = [
  {
    key: "basic",
    name: "Basic",
    priceLabel: "$5 / month",
    summary: "Access to the full drill library.",
    features: ["Full drill library", "Weekly program updates", "Mobile-friendly access"],
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "$15 / month",
    summary: "Drill library plus weekly swing analysis feedback.",
    features: [
      "Everything in Basic",
      "Weekly swing analysis feedback",
      "Personal progress tracking",
    ],
  },
  {
    key: "elite",
    name: "Elite",
    priceLabel: "$25 / month",
    summary: "Everything in Pro plus priority support and group coaching calls.",
    features: [
      "Everything in Pro",
      "Priority feedback turnaround",
      "Monthly live group calls",
    ],
  },
];

export const tierRank: Record<TierKey, number> = {
  basic: 1,
  pro: 2,
  elite: 3,
};

export const keyToDatabaseTier: Record<TierKey, DatabaseTier> = {
  basic: "BASIC",
  pro: "PRO",
  elite: "ELITE",
};

export const databaseTierToKey: Record<DatabaseTier, TierKey> = {
  BASIC: "basic",
  PRO: "pro",
  ELITE: "elite",
};

export const validDatabaseTiers: DatabaseTier[] = ["BASIC", "PRO", "ELITE"];

export function isDatabaseTier(value: string): value is DatabaseTier {
  return validDatabaseTiers.includes(value as DatabaseTier);
}
