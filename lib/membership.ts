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
    priceLabel: "$0",
    summary: "Start with a free assessment call and one coaching submission from Coach Broc.",
    features: [
      "Free 20-minute Player Assessment Call with Coach Broc",
      "1 free coaching submission with personal feedback from Coach Broc",
      "No credit card required",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    priceLabel: "$59 one-time",
    summary: "Lifetime access to the full drill library, workouts, and core training PDFs.",
    features: [
      "Lifetime access -- pay once, access forever",
      "Full hitting, fielding, and mindset video drill library",
      "7 downloadable workout programs (Strength, Speed-Agility, and Mobility)",
      "Pre-Game Warmup Routine PDF",
      "Nutrition and Fueling Guide PDF",
      "Mental Game Workbook PDF",
      "Parent Guide PDF",
      "New content added regularly",
    ],
  },
  {
    key: "memorable",
    name: "Memorable",
    priceLabel: "$149 / month",
    summary: "Everything in Basic plus monthly coaching submissions and accountability support.",
    features: [
      "Everything in Basic",
      "2 coaching submissions per month",
      "Personal video feedback from Coach Broc within 48 hours",
      "1-on-1 Coaching right in your pocket",
      "Monthly goal setting check-in with Coach Broc",
      "Weekly accountability check-ins",
      "Direct access to Coach Broc between submissions",
    ],
  },
  {
    key: "elite",
    name: "Elite",
    priceLabel: "$249 / month",
    summary:
      "Everything in Memorable plus priority response, group coaching, and personalized plans.",
    features: [
      "Everything in Memorable",
      "4 coaching submissions per month with rollover up to 8",
      "Priority 24-hour response from Coach Broc",
      "Personalized monthly development plan from Coach Broc",
      "Monthly group coaching call with Coach Broc",
      "College Recruiting Guide PDF",
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

export function isLifetimeBasicMember(
  membershipTier: DatabaseTier,
  stripeSubscriptionId: string | null | undefined,
) {
  return membershipTier === "BASIC" && !stripeSubscriptionId;
}
