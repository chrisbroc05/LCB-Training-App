/**
 * Playbook / Basic tier entitlements (client-safe: no server imports).
 */

import type { DatabaseTier } from "@/lib/membership";
import { hasDatabaseTierAccess } from "@/lib/membership";

export type PlaybookEntitlementFields = {
  membershipTier: DatabaseTier;
  playbookLegacyAccess: boolean;
};

export const PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW = 1;
export const PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_LEGACY = 2;

export function hasPlaybookLegacyAccess(user: PlaybookEntitlementFields): boolean {
  return user.membershipTier === "BASIC" && user.playbookLegacyAccess;
}

export function canAccessPlaybookContent(user: PlaybookEntitlementFields): boolean {
  return hasDatabaseTierAccess(user.membershipTier, "basic");
}

export function hasFullDrillLibraryAccess(user: PlaybookEntitlementFields): boolean {
  if (
    user.membershipTier === "TWELVE_WEEK" ||
    user.membershipTier === "MEMORABLE" ||
    user.membershipTier === "ELITE"
  ) {
    return true;
  }
  if (user.membershipTier === "BASIC") {
    return user.playbookLegacyAccess;
  }
  return false;
}

export function hasPlaybookWorkoutProgramDownloads(user: PlaybookEntitlementFields): boolean {
  return hasFullDrillLibraryAccess(user);
}

export function getPlaybookLifetimeSubmissionLimit(user: PlaybookEntitlementFields): number | null {
  if (user.membershipTier !== "BASIC") {
    return null;
  }
  return user.playbookLegacyAccess
    ? PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_LEGACY
    : PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW;
}

export type DrillViewEntitlementContext = PlaybookEntitlementFields & {
  starterDrillIds: ReadonlySet<string>;
  grantedDrillIds: readonly string[];
  /** Future: ORG_TRIAL uses the same starter drill set. */
  orgTrialStarterAccess?: boolean;
};

export function canViewDrill(context: DrillViewEntitlementContext, drillId: string): boolean {
  if (hasFullDrillLibraryAccess(context)) {
    return true;
  }
  if (context.grantedDrillIds.includes(drillId)) {
    return true;
  }
  if (!context.starterDrillIds.has(drillId)) {
    return false;
  }
  if (context.orgTrialStarterAccess) {
    return true;
  }
  if (context.membershipTier === "BASIC") {
    return true;
  }
  return false;
}

export function canAccessDrillLibraryBrowse(user: PlaybookEntitlementFields): boolean {
  return canAccessPlaybookContent(user);
}
