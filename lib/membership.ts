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
      "No workout program access",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    priceLabel: "$5 / month",
    summary: "Full drill libraries and all downloadable workout programs.",
    features: [
      "Full hitting, fielding, and mindset video drill library",
      "All 9 downloadable workout programs",
      "No swing analysis submissions",
      "No mental game support submissions",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "$9 / month",
    summary: "Everything in Basic plus unlimited coaching submissions.",
    features: [
      "Everything in Basic",
      "Unlimited swing analysis submissions",
      "Unlimited mental game support submissions",
      "48-hour response time",
    ],
  },
  {
    key: "elite",
    name: "Elite",
    priceLabel: "$14 / month",
    summary: "Everything in Pro plus priority feedback and monthly group call access.",
    features: [
      "Everything in Pro",
      "Priority feedback",
      "Monthly group coaching call",
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

export function canAccessDrillLibrary(userTier: DatabaseTier) {
  return hasDatabaseTierAccess(userTier, "basic");
}

export function canAccessWorkoutPrograms(userTier: DatabaseTier) {
  return hasDatabaseTierAccess(userTier, "basic");
}

export function canSubmitCoachingForms(userTier: DatabaseTier, freeSubmissionUsed: boolean) {
  if (userTier === "PRO" || userTier === "ELITE") {
    return true;
  }

  if (userTier === "FREE" && !freeSubmissionUsed) {
    return true;
  }

  return false;
}

export function getCoachingSubmissionLockReason(
  userTier: DatabaseTier,
  freeSubmissionUsed: boolean,
): "basic" | "free-used" | null {
  if (userTier === "BASIC") {
    return "basic";
  }

  if (userTier === "FREE" && freeSubmissionUsed) {
    return "free-used";
  }

  return null;
}
