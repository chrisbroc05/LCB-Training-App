/**
 * Playbook / drill entitlements (client-safe). Delegates to access-shared.
 */

import {
  canAccessDrillLibraryBrowse,
  canViewDrill as accessCanViewDrill,
  canViewPlaybook as accessCanViewPlaybook,
  canDownloadWorkoutPdfs,
  hasFullDrillLibraryAccess as accessHasFullDrillLibrary,
  type AccessUserFields,
  type DrillViewAccessContext,
} from "@/lib/access-shared";
import type { DatabaseTier } from "@/lib/membership";
export type PlaybookEntitlementFields = AccessUserFields;

export const PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW = 1;
export const PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_LEGACY = 2;

export function toPlaybookEntitlementFields(
  membershipTier: DatabaseTier,
  playbookLegacyAccess: boolean,
  membershipLevel: AccessUserFields["membershipLevel"] = null,
  membershipLevelExpiresAt: AccessUserFields["membershipLevelExpiresAt"] = null,
): PlaybookEntitlementFields {
  return {
    membershipTier,
    playbookLegacyAccess,
    membershipLevel,
    membershipLevelExpiresAt,
  };
}

export function hasPlaybookLegacyAccess(user: PlaybookEntitlementFields): boolean {
  return user.membershipTier === "BASIC" && user.playbookLegacyAccess;
}

export function canAccessPlaybookContent(user: PlaybookEntitlementFields): boolean {
  return accessCanViewPlaybook(user);
}

export function hasFullDrillLibraryAccess(user: PlaybookEntitlementFields): boolean {
  return accessHasFullDrillLibrary(user);
}

export function hasPlaybookWorkoutProgramDownloads(user: PlaybookEntitlementFields): boolean {
  return canDownloadWorkoutPdfs(user);
}

export function getPlaybookLifetimeSubmissionLimit(user: PlaybookEntitlementFields): number | null {
  if (user.membershipTier !== "BASIC") {
    return null;
  }
  return user.playbookLegacyAccess
    ? PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_LEGACY
    : PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW;
}

export type DrillViewEntitlementContext = DrillViewAccessContext;

export function canViewDrill(context: DrillViewEntitlementContext, drillId: string): boolean {
  return accessCanViewDrill(context, drillId);
}

export function canAccessDrillLibraryBrowse(user: PlaybookEntitlementFields): boolean {
  return canAccessDrillLibraryBrowse(user);
}
