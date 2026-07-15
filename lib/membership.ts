export type TierKey = "free" | "basic" | "memorable" | "elite";
export type DatabaseTier = "FREE" | "BASIC" | "MEMORABLE" | "ELITE";

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
    summary: "Try personalized coaching with one free submission from Coach Broc.",
    features: [
      "1 free coaching submission (swing analysis or mental game support)",
      "Personal feedback from Coach Broc",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    priceLabel: "$39 / month",
    summary: "Self-guided training with the full drill library, workouts, and PDF resources.",
    features: [
      "Full hitting, fielding, and mindset video drill library",
      "All 9 workout programs (Strength, Speed-Agility, Mobility for all ages)",
      "Pre-Game Warmup Routine PDF",
      "Nutrition & Fueling Guide PDF",
      "Self-guided — no coaching submissions",
    ],
  },
  {
    key: "memorable",
    name: "Memorable",
    priceLabel: "$119 / month",
    summary: "Everything in Basic plus monthly coaching submissions and accountability support.",
    features: [
      "Everything in Basic",
      "2 coaching submissions per month (swing analysis or mental game support)",
      "48-hour video feedback from Coach Broc",
      "Monthly goal setting check-in",
      "Weekly accountability check-in",
      "Mental Game Workbook PDF",
      "Parent Guide PDF",
      "1-on-1 scheduling via text or email",
    ],
  },
  {
    key: "elite",
    name: "Elite",
    priceLabel: "$179 / month",
    summary:
      "Everything in Memorable plus priority response, group coaching, and personalized plans.",
    features: [
      "Everything in Memorable",
      "4 coaching submissions per month with rollover up to 8 maximum",
      "Priority 24-hour response time",
      "Monthly group coaching call",
      "Personalized monthly development plan from Coach Broc",
      "College Recruiting Guide PDF",
      "Weekly training plan curated by Coach Broc",
    ],
  },
];

export const paidMembershipTiers = membershipTiers.filter(
  (tier): tier is MembershipTier & { key: Exclude<TierKey, "free"> } => tier.key !== "free",
);

export function getCoachingResponseTimeLabel(tier: DatabaseTier) {
  if (tier === "ELITE") {
    return "24 hours (priority)";
  }

  return "48 hours";
}

export const tierRank: Record<TierKey, number> = {
  free: 0,
  basic: 1,
  memorable: 2,
  elite: 3,
};

export const keyToDatabaseTier: Record<TierKey, DatabaseTier> = {
  free: "FREE",
  basic: "BASIC",
  memorable: "MEMORABLE",
  elite: "ELITE",
};

export const databaseTierToKey: Record<DatabaseTier, TierKey> = {
  FREE: "free",
  BASIC: "basic",
  MEMORABLE: "memorable",
  ELITE: "elite",
};

export const validDatabaseTiers: DatabaseTier[] = ["FREE", "BASIC", "MEMORABLE", "ELITE"];

export function formatDatabaseTierLabel(tier: DatabaseTier): string {
  if (tier === "MEMORABLE") {
    return "Memorable";
  }

  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

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

export function canAccessCoachingNav(userTier: DatabaseTier) {
  return hasDatabaseTierAccess(userTier, "memorable");
}
