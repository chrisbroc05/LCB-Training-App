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
    summary:
      "Start with a free Player Assessment Call and one coaching submission with personal feedback from Coach Broc.",
    features: [
      "Start with a free 20-minute Player Assessment Call with Coach Broc via Google Meet",
      "One free coaching submission where Coach Broc personally reviews your swing or mental game and sends real feedback",
      "No credit card required. Just show up ready to work.",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    priceLabel: "$59 one-time",
    summary:
      "Lifetime access to the full LCB Training content library with drills, workouts, and bonus resources.",
    features: [
      "Lifetime access to the full LCB Training content library",
      "Full hitting, fielding, and mindset video drill library built around real game situations",
      "8 downloadable workout programs covering strength, speed and agility, mobility, rotational power",
      "Bonus resources including the Pre-Game Warmup Routine, Nutrition Guide, Mental Game Workbook, and Parent Guide",
      "New content added regularly",
    ],
  },
  {
    key: "memorable",
    name: "Memorable",
    priceLabel: "$149 / month",
    summary:
      "Everything in Basic plus real 1-on-1 coaching, monthly submissions, and accountability support.",
    features: [
      "Everything in Basic plus real 1-on-1 coaching",
      "2 coaching submissions per month where Coach Broc sends back detailed personal feedback within 48 hours",
      "Monthly goal setting check-in to map out what you are working toward",
      "Weekly accountability check-ins",
      "Direct access to Coach Broc between submissions",
    ],
  },
  {
    key: "elite",
    name: "Elite",
    priceLabel: "$249 / month",
    summary:
      "Everything in Memorable plus priority response, personalized plans, group coaching, and recruiting guidance.",
    features: [
      "Everything in Memorable plus the highest level of personal coaching available",
      "4 coaching submissions per month with rollover up to 8",
      "Priority 24-hour response from Coach Broc",
      "Personalized monthly development plan from Coach Broc",
      "Monthly group coaching call including live film breakdown and Q and A",
      "College recruiting guidance and the College Baseball Recruiting Guide",
    ],
  },
];

export const paidMembershipTiers = membershipTiers.filter(
  (tier): tier is MembershipTier & { key: Exclude<TierKey, "free"> } => tier.key !== "free",
);

export const memorableUpgradePitch =
  "Everything in Basic plus real 1-on-1 coaching, 2 monthly submissions with personal feedback, goal setting, and weekly accountability.";

export const eliteUpgradePitch =
  "Everything in Memorable plus 4 monthly submissions with rollover, priority 24-hour response, a personalized development plan, group coaching calls, and college recruiting guidance.";

export const memorableRequiredMessage = `Coaching submissions are available on Memorable and Elite memberships. Upgrade to Memorable for ${memorableUpgradePitch}`;

export const goalCheckinRequiredMessage = `Monthly goal check-ins are available on Memorable and Elite memberships. Upgrade to Memorable for ${memorableUpgradePitch}`;

export const freeSubmissionUsedUpgradeMessage = `Your one free submission has already been used. Upgrade to Memorable or Elite for ${memorableUpgradePitch}`;

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
