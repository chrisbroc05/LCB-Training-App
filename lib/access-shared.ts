/**
 * Central membership access (client-safe). Resolves effective level and feature gates.
 */

import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  formatMembershipLevelLabel,
  getUpgradeLabelForLevel,
  MEMBERSHIP_LEVELS,
} from "@/lib/membership-levels-shared";
import type { DatabaseTier } from "@/lib/membership";
import {
  ELITE_MONTHLY_LIMIT,
  ELITE_ROLLOVER_CAP,
  ELITE_TOTAL_AVAILABLE_CAP,
  getCoachingSubmissionAvailability,
  MEMORABLE_MONTHLY_LIMIT,
  type CoachingSubmissionUserFields,
} from "@/lib/coaching-submissions-shared";
import type { WorkoutResource } from "@/lib/workout-resources";

const PLAYBOOK_INCLUDED_GUIDE_FILENAMES = [
  "LCB_PreGame_Warmup.pdf",
  "LCB_Nutrition_Guide.pdf",
  "LCB_Mental_Game_Workbook.pdf",
  "LCB_Parent_Guide.pdf",
] as const;
import { PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW } from "@/lib/playbook-entitlements-shared";

export type EffectiveAccessLevel =
  | "TWELVE_WEEK"
  | "ALL_ACCESS"
  | "PLUS"
  | "CORE"
  | "LEGACY_ELITE"
  | "LEGACY_MEMORABLE"
  | "PLAYBOOK"
  | "FREE";

export type AccessUserFields = {
  membershipTier: DatabaseTier;
  membershipLevel: MembershipLevelKey | null;
  membershipLevelExpiresAt: Date | string | null;
  playbookLegacyAccess: boolean;
};

export type DrillViewAccessContext = AccessUserFields & {
  starterDrillIds: ReadonlySet<string>;
  grantedDrillIds: readonly string[];
};

const LEVEL_RANK: Record<EffectiveAccessLevel, number> = {
  TWELVE_WEEK: 100,
  ALL_ACCESS: 100,
  PLUS: 80,
  CORE: 60,
  LEGACY_ELITE: 55,
  LEGACY_MEMORABLE: 50,
  PLAYBOOK: 30,
  FREE: 0,
};

function parseExpiry(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function activeMembershipLevel(user: AccessUserFields, now = new Date()): MembershipLevelKey | null {
  if (!user.membershipLevel) {
    return null;
  }
  const expires = parseExpiry(user.membershipLevelExpiresAt);
  if (expires && expires.getTime() <= now.getTime()) {
    return null;
  }
  return user.membershipLevel;
}

export function resolveEffectiveLevel(user: AccessUserFields, now = new Date()): EffectiveAccessLevel {
  if (user.membershipTier === "TWELVE_WEEK") {
    return "TWELVE_WEEK";
  }

  const level = activeMembershipLevel(user, now);
  if (level === "ALL_ACCESS") {
    return "ALL_ACCESS";
  }
  if (level === "PLUS") {
    return "PLUS";
  }
  if (level === "CORE") {
    return "CORE";
  }

  if (user.membershipTier === "ELITE") {
    return "LEGACY_ELITE";
  }
  if (user.membershipTier === "MEMORABLE") {
    return "LEGACY_MEMORABLE";
  }
  if (user.membershipTier === "BASIC") {
    return "PLAYBOOK";
  }

  return "FREE";
}

export function hasEffectiveRankAtLeast(
  user: AccessUserFields,
  minimum: EffectiveAccessLevel,
  now = new Date(),
): boolean {
  const effective = resolveEffectiveLevel(user, now);
  return LEVEL_RANK[effective] >= LEVEL_RANK[minimum];
}

export function hasFullDrillLibraryAccess(user: AccessUserFields, now = new Date()): boolean {
  const effective = resolveEffectiveLevel(user, now);
  if (
    effective === "TWELVE_WEEK" ||
    effective === "ALL_ACCESS" ||
    effective === "PLUS" ||
    effective === "LEGACY_ELITE" ||
    effective === "LEGACY_MEMORABLE"
  ) {
    return true;
  }
  if (effective === "PLAYBOOK" && user.playbookLegacyAccess) {
    return true;
  }
  return false;
}

export function canAccessDrillLibraryBrowse(user: AccessUserFields, now = new Date()): boolean {
  const effective = resolveEffectiveLevel(user, now);
  return effective !== "FREE";
}

export function canViewDrill(context: DrillViewAccessContext, drillId: string, now = new Date()): boolean {
  if (hasFullDrillLibraryAccess(context, now)) {
    return true;
  }
  if (context.grantedDrillIds.includes(drillId)) {
    return true;
  }
  if (!context.starterDrillIds.has(drillId)) {
    return false;
  }
  const effective = resolveEffectiveLevel(context, now);
  return effective === "CORE" || effective === "PLAYBOOK";
}

export function canViewPlaybook(user: AccessUserFields, now = new Date()): boolean {
  const effective = resolveEffectiveLevel(user, now);
  return (
    effective === "TWELVE_WEEK" ||
    effective === "ALL_ACCESS" ||
    effective === "PLUS" ||
    effective === "PLAYBOOK" ||
    effective === "LEGACY_ELITE" ||
    effective === "LEGACY_MEMORABLE"
  );
}

export type WorkoutAccessMode = "starter_in_app" | "full_programs" | "none";

export function getWorkoutAccessMode(user: AccessUserFields, now = new Date()): WorkoutAccessMode {
  const effective = resolveEffectiveLevel(user, now);
  if (
    effective === "TWELVE_WEEK" ||
    effective === "ALL_ACCESS" ||
    effective === "PLUS" ||
    effective === "LEGACY_ELITE" ||
    effective === "LEGACY_MEMORABLE"
  ) {
    return "full_programs";
  }
  if (effective === "PLAYBOOK" && user.playbookLegacyAccess) {
    return "full_programs";
  }
  if (effective === "CORE") {
    return "starter_in_app";
  }
  return "none";
}

export function canViewWorkoutInApp(user: AccessUserFields, now = new Date()): boolean {
  return getWorkoutAccessMode(user, now) !== "none";
}

export function canDownloadWorkoutPdfs(user: AccessUserFields, now = new Date()): boolean {
  return getWorkoutAccessMode(user, now) === "full_programs";
}

const CORE_GUIDE_FILENAMES = new Set([
  "LCB_PreGame_Warmup.pdf",
  "LCB_Nutrition_Guide.pdf",
  "LCB_Parent_Guide.pdf",
  "LCB_Arm_Care_4Week_Starter.pdf",
]);

const PLUS_EXTRA_GUIDE_FILENAMES = new Set([
  ...PLAYBOOK_INCLUDED_GUIDE_FILENAMES,
  "LCB_Rotational_Sample.pdf",
]);

const RECRUITING_GUIDE = "LCB_Recruiting_Guide.pdf";

export function canDownloadGuideFilename(user: AccessUserFields, filename: string, now = new Date()): boolean {
  const effective = resolveEffectiveLevel(user, now);

  if (filename === RECRUITING_GUIDE) {
    return effective === "TWELVE_WEEK" || effective === "ALL_ACCESS";
  }

  if (effective === "TWELVE_WEEK" || effective === "ALL_ACCESS") {
    return true;
  }

  if (effective === "PLUS" || effective === "LEGACY_ELITE" || effective === "LEGACY_MEMORABLE") {
    if (filename === RECRUITING_GUIDE) {
      return false;
    }
    return PLUS_EXTRA_GUIDE_FILENAMES.has(filename) || CORE_GUIDE_FILENAMES.has(filename);
  }

  if (effective === "CORE") {
    return CORE_GUIDE_FILENAMES.has(filename);
  }

  if (effective === "PLAYBOOK") {
    if (filename === "LCB_Rotational_Sample.pdf") {
      return user.playbookLegacyAccess;
    }
    return PLAYBOOK_INCLUDED_GUIDE_FILENAMES.includes(
      filename as (typeof PLAYBOOK_INCLUDED_GUIDE_FILENAMES)[number],
    );
  }

  return false;
}

export function canDownloadGuideResource(user: AccessUserFields, resource: WorkoutResource, now = new Date()) {
  return canDownloadGuideFilename(user, resource.filename, now);
}

export function canMessageCoach(user: AccessUserFields, now = new Date()): boolean {
  const effective = resolveEffectiveLevel(user, now);
  return (
    effective === "TWELVE_WEEK" ||
    effective === "ALL_ACCESS" ||
    effective === "PLUS" ||
    effective === "LEGACY_ELITE" ||
    effective === "LEGACY_MEMORABLE"
  );
}

export function getMessagingReplyCopy(user: AccessUserFields, now = new Date()): string | null {
  const effective = resolveEffectiveLevel(user, now);
  if (effective === "ALL_ACCESS" || effective === "TWELVE_WEEK" || effective === "LEGACY_ELITE") {
    return "Coach Broc usually replies within 24 hours.";
  }
  if (effective === "PLUS" || effective === "LEGACY_MEMORABLE") {
    return "Coach Broc usually replies within a couple of days.";
  }
  return null;
}

export type ReviewAllowanceKind = "unlimited" | "in_depth_monthly" | "quick_six_weeks" | "playbook_lifetime" | "free_once" | "legacy_monthly" | "none";

export type ReviewAllowance = {
  kind: ReviewAllowanceKind;
  canSubmit: boolean;
  remaining: number;
  limit: number | null;
  periodLabel: string | null;
};

export function getReviewAllowance(
  user: CoachingSubmissionUserFields & AccessUserFields,
  now = new Date(),
): ReviewAllowance {
  const effective = resolveEffectiveLevel(user, now);

  if (effective === "TWELVE_WEEK" || effective === "ALL_ACCESS") {
    return {
      kind: "unlimited",
      canSubmit: true,
      remaining: 999,
      limit: null,
      periodLabel: null,
    };
  }

  if (effective === "PLUS") {
    const availability = getCoachingSubmissionAvailability(user, now);
    const monthlyLimit = 1;
    const used = user.coachingSubmissionsUsedThisMonth;
    const periodKey = availability.periodKey;
    const remaining = Math.max(0, monthlyLimit - used);
    return {
      kind: "in_depth_monthly",
      canSubmit: remaining > 0,
      remaining,
      limit: monthlyLimit,
      periodLabel: periodKey,
    };
  }

  if (effective === "CORE") {
    return {
      kind: "quick_six_weeks",
      canSubmit: true,
      remaining: 1,
      limit: 1,
      periodLabel: "every 6 weeks",
    };
  }

  if (effective === "LEGACY_MEMORABLE" || effective === "LEGACY_ELITE") {
    const availability = getCoachingSubmissionAvailability(user, now);
    return {
      kind: "legacy_monthly",
      canSubmit: availability.canSubmit,
      remaining: availability.remaining,
      limit: availability.monthlyLimit,
      periodLabel: availability.periodKey,
    };
  }

  if (effective === "PLAYBOOK") {
    const availability = getCoachingSubmissionAvailability(user, now);
    return {
      kind: "playbook_lifetime",
      canSubmit: availability.canSubmit,
      remaining: availability.remaining,
      limit: availability.lifetimeLimit,
      periodLabel: null,
    };
  }

  if (effective === "FREE") {
    const availability = getCoachingSubmissionAvailability(user, now);
    return {
      kind: "free_once",
      canSubmit: availability.canSubmit,
      remaining: availability.remaining,
      limit: 1,
      periodLabel: null,
    };
  }

  return {
    kind: "none",
    canSubmit: false,
    remaining: 0,
    limit: 0,
    periodLabel: null,
  };
}

export function isFixItIncluded(_user: AccessUserFields, _planSlug: string, _now = new Date()): boolean {
  return false;
}

export function hasPersonalProgramDashboard(user: AccessUserFields, now = new Date()): boolean {
  const effective = resolveEffectiveLevel(user, now);
  return effective === "TWELVE_WEEK" || effective === "ALL_ACCESS";
}

export function usesFixedTwelveWeekProgram(user: AccessUserFields, now = new Date()): boolean {
  return resolveEffectiveLevel(user, now) === "TWELVE_WEEK";
}

export function usesOpenEndedProgram(user: AccessUserFields, now = new Date()): boolean {
  return resolveEffectiveLevel(user, now) === "ALL_ACCESS";
}

export type LockedContentHint = {
  locked: boolean;
  upgradeLevel: MembershipLevelKey | null;
  message: string;
};

export function getDrillLockHint(user: AccessUserFields, drillId: string, context: DrillViewAccessContext): LockedContentHint {
  if (canViewDrill(context, drillId)) {
    return { locked: false, upgradeLevel: null, message: "" };
  }
  const effective = resolveEffectiveLevel(user);
  if (effective === "FREE") {
    return { locked: true, upgradeLevel: "CORE", message: getUpgradeLabelForLevel("CORE") };
  }
  return { locked: true, upgradeLevel: "PLUS", message: getUpgradeLabelForLevel("PLUS") };
}

export function getWorkoutLockHint(user: AccessUserFields): LockedContentHint {
  const mode = getWorkoutAccessMode(user);
  if (mode === "full_programs" || mode === "starter_in_app") {
    return { locked: false, upgradeLevel: null, message: "" };
  }
  const effective = resolveEffectiveLevel(user);
  if (effective === "PLAYBOOK") {
    return { locked: true, upgradeLevel: "PLUS", message: getUpgradeLabelForLevel("PLUS") };
  }
  return { locked: true, upgradeLevel: "CORE", message: getUpgradeLabelForLevel("CORE") };
}

export function formatEffectiveAccessLabel(user: AccessUserFields, now = new Date()): string {
  const effective = resolveEffectiveLevel(user, now);
  if (effective === "TWELVE_WEEK") {
    return "12-Week Program";
  }
  if (effective === "ALL_ACCESS" || effective === "PLUS" || effective === "CORE") {
    return MEMBERSHIP_LEVELS[effective].displayName;
  }
  if (effective === "PLAYBOOK") {
    return user.playbookLegacyAccess ? "Playbook (legacy)" : "Playbook";
  }
  if (effective === "LEGACY_MEMORABLE") {
    return "Member";
  }
  if (effective === "LEGACY_ELITE") {
    return "Member";
  }
  return "Free";
}

export function legacyMonthlyLimitsForTests() {
  return {
    memorable: MEMORABLE_MONTHLY_LIMIT,
    elite: ELITE_MONTHLY_LIMIT,
    eliteCap: ELITE_TOTAL_AVAILABLE_CAP,
    eliteRolloverCap: ELITE_ROLLOVER_CAP,
    playbookNew: PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW,
  };
}

export { formatMembershipLevelLabel, getUpgradeLabelForLevel };
