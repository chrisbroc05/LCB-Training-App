import {
  canAccessDrillLibraryBrowse,
  canDownloadWorkoutPdfs,
  canViewPlaybook,
  getWorkoutAccessMode,
  hasFullDrillLibraryAccess,
} from "@/lib/access-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { toPlaybookEntitlementFields } from "@/lib/playbook-entitlements-shared";

export type TierKey = "free" | "basic" | "twelveWeek" | "memorable" | "elite";
export type DatabaseTier = "FREE" | "BASIC" | "TWELVE_WEEK" | "MEMORABLE" | "ELITE";

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
    priceLabel: "Free",
    summary:
      "One coaching submission with personal feedback from Coach Broc.",
    features: [
      "One free coaching submission where Coach Broc personally reviews your swing or mental game and sends real feedback",
      "No credit card required. Just show up ready to work.",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    priceLabel: "$59 one-time",
    summary:
      "The Next Level Playbook plus 1 swing or video breakdown from Coach Broc, a starter drill set, and four bonus guides.",
    features: [
      "The Next Level Playbook -- 4 interactive chapters with reflection questions",
      "1 personal swing or video breakdown from Coach Broc (lifetime, not monthly)",
      "Starter set of hitting, fielding, and mindset drills from the library",
      "Mental Game Workbook, Pre-Game Warmup Routine, Parent Guide, and Nutrition Guide",
      "Downloadable PDF of your completed playbook with your personal answers",
      "Lifetime access -- pay once, never pay again",
    ],
  },
];

/** @deprecated Legacy subscription tiers removed from marketing; enum kept for existing accounts. */
export const memorableSignupDescription = "Legacy membership.";
/** @deprecated Legacy subscription tiers removed from marketing; enum kept for existing accounts. */
export const eliteSignupDescription = "Legacy membership.";

export const paidMembershipTiers = membershipTiers.filter(
  (tier): tier is MembershipTier & { key: Exclude<TierKey, "free"> } => tier.key !== "free",
);

export const memorableUpgradePitch =
  "Everything in Basic plus real 1-on-1 coaching, 2 monthly submissions with personal feedback, goal setting, and weekly accountability.";

export const eliteUpgradePitch =
  "Everything in Memorable plus 4 monthly submissions with rollover, priority 24-hour response, a personalized development plan, group coaching calls, and college recruiting guidance.";

export const twelveWeekProgramRequiredMessage =
  "Coaching submissions are available with the 12-Week Coaching Program.";

export const memorableRequiredMessage = twelveWeekProgramRequiredMessage;

export const goalCheckinRequiredMessage =
  "Monthly goal check-ins are available with the 12-Week Coaching Program.";

export const freeSubmissionUsedUpgradeMessage =
  "Your one free submission has already been used. Join the 12-Week Coaching Program for unlimited submissions and full coaching support.";

export function getCoachingResponseTimeLabel(_tier: DatabaseTier) {
  return "a few days";
}

export const tierRank: Record<TierKey, number> = {
  free: 0,
  basic: 1,
  twelveWeek: 2,
  memorable: 2,
  elite: 3,
};

export const keyToDatabaseTier: Record<TierKey, DatabaseTier> = {
  free: "FREE",
  basic: "BASIC",
  twelveWeek: "TWELVE_WEEK",
  memorable: "MEMORABLE",
  elite: "ELITE",
};

export const databaseTierToKey: Record<DatabaseTier, TierKey> = {
  FREE: "free",
  BASIC: "basic",
  TWELVE_WEEK: "twelveWeek",
  MEMORABLE: "memorable",
  ELITE: "elite",
};

export const validDatabaseTiers: DatabaseTier[] = [
  "FREE",
  "BASIC",
  "TWELVE_WEEK",
  "MEMORABLE",
  "ELITE",
];

export function formatDatabaseTierLabel(tier: DatabaseTier): string {
  if (tier === "MEMORABLE" || tier === "ELITE") {
    return "Member";
  }

  if (tier === "TWELVE_WEEK") {
    return "12-Week Program";
  }

  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

export function formatUserFacingMembershipLabel(tier: DatabaseTier): string {
  if (tier === "TWELVE_WEEK") {
    return "12-Week Coaching Program";
  }

  if (tier === "FREE") {
    return "Free";
  }

  if (tier === "BASIC") {
    return "Basic";
  }

  return "Member";
}

export function isTwelveWeekProgramEnrolled(tier: DatabaseTier) {
  return tier === "TWELVE_WEEK";
}

export function isTwelveWeekProgramMember(tier: DatabaseTier) {
  return tier === "TWELVE_WEEK";
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

function accessFields(
  userTier: DatabaseTier,
  playbookLegacyAccess = false,
  membershipLevel: MembershipLevelKey | null = null,
  membershipLevelExpiresAt: Date | string | null = null,
) {
  return toPlaybookEntitlementFields(
    userTier,
    playbookLegacyAccess,
    membershipLevel,
    membershipLevelExpiresAt,
  );
}

export function canAccessDrillLibrary(
  userTier: DatabaseTier,
  playbookLegacyAccess = false,
  membershipLevel: MembershipLevelKey | null = null,
  membershipLevelExpiresAt: Date | string | null = null,
) {
  return canAccessDrillLibraryBrowse(
    accessFields(userTier, playbookLegacyAccess, membershipLevel, membershipLevelExpiresAt),
  );
}

/** Full library (all drills unlocked). New Basic buyers get starter drills only. */
export function canAccessFullDrillLibrary(
  userTier: DatabaseTier,
  playbookLegacyAccess: boolean,
  membershipLevel: MembershipLevelKey | null = null,
  membershipLevelExpiresAt: Date | string | null = null,
) {
  return hasFullDrillLibraryAccess(
    accessFields(userTier, playbookLegacyAccess, membershipLevel, membershipLevelExpiresAt),
  );
}

export function canAccessPlaybook(
  userTier: DatabaseTier,
  playbookLegacyAccess = false,
  membershipLevel: MembershipLevelKey | null = null,
  membershipLevelExpiresAt: Date | string | null = null,
) {
  return canViewPlaybook(
    accessFields(userTier, playbookLegacyAccess, membershipLevel, membershipLevelExpiresAt),
  );
}

export const playbookLockedMessage =
  "Unlock The Next Level Playbook and all four chapters with the 12-Week Coaching Program.";

export function canAccessWorkoutPrograms(
  userTier: DatabaseTier,
  playbookLegacyAccess = false,
  membershipLevel: MembershipLevelKey | null = null,
  membershipLevelExpiresAt: Date | string | null = null,
) {
  return canDownloadWorkoutPdfs(
    accessFields(userTier, playbookLegacyAccess, membershipLevel, membershipLevelExpiresAt),
  );
}

export function canViewStarterWorkoutsInApp(
  userTier: DatabaseTier,
  playbookLegacyAccess = false,
  membershipLevel: MembershipLevelKey | null = null,
  membershipLevelExpiresAt: Date | string | null = null,
) {
  return (
    getWorkoutAccessMode(
      accessFields(userTier, playbookLegacyAccess, membershipLevel, membershipLevelExpiresAt),
    ) === "starter_in_app"
  );
}

/** Basic+ can open My Downloads (guides for new Basic, full set for legacy). */
export function canAccessMemberDownloadsPage(userTier: DatabaseTier) {
  return hasDatabaseTierAccess(userTier, "basic");
}

export function canAccessCoachingNav(userTier: DatabaseTier) {
  return userTier === "TWELVE_WEEK" || hasDatabaseTierAccess(userTier, "memorable");
}

export function isLifetimeBasicMember(
  membershipTier: DatabaseTier,
  stripeSubscriptionId: string | null | undefined,
) {
  return membershipTier === "BASIC" && !stripeSubscriptionId;
}

export function isManualMembershipMember(
  membershipTier: DatabaseTier,
  stripeSubscriptionId: string | null | undefined,
) {
  return (
    (membershipTier === "MEMORABLE" || membershipTier === "ELITE") && !stripeSubscriptionId
  );
}
