/**
 * Org-trial January unlock labels (client-safe).
 * Names the membership that unlocks locked content once trials end.
 */

import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import {
  RECRUITING_GUIDE_LOCK_HREF,
  RECRUITING_GUIDE_LOCK_LABEL,
} from "@/lib/recruiting-guide-lock-copy-shared";

export type OrgTrialJanuaryUnlockMembership = "CORE" | "PLUS" | "MEMBERSHIP";

export type OrgTrialLockedContentSurface =
  | "drill"
  | "workout"
  | "playbook"
  | "guide"
  | "recruiting"
  | "messaging"
  | "mixed";

export const ORG_TRIAL_JANUARY_UNLOCK_CORE_LABEL =
  "Unlocks in January with a Core membership";

export const ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL =
  "Unlocks in January with a Plus membership";

export const ORG_TRIAL_JANUARY_UNLOCK_MEMBERSHIP_LABEL =
  "Unlocks in January with a membership";

/** Recruiting Guide: All-Access or 12-Week (no January wording). */
export const ORG_TRIAL_RECRUITING_LOCK_LABEL = RECRUITING_GUIDE_LOCK_LABEL;

export const ORG_TRIAL_RECRUITING_LOCK_HREF = RECRUITING_GUIDE_LOCK_HREF;

export function getOrgTrialJanuaryUnlockLabel(
  membership: OrgTrialJanuaryUnlockMembership,
): string {
  if (membership === "CORE") {
    return ORG_TRIAL_JANUARY_UNLOCK_CORE_LABEL;
  }
  if (membership === "PLUS") {
    return ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL;
  }
  return ORG_TRIAL_JANUARY_UNLOCK_MEMBERSHIP_LABEL;
}

/**
 * Link target for tappable January unlock labels:
 * membership levels page when public, otherwise the 12-Week Program page.
 */
export function getOrgTrialJanuaryMembershipHref(): string {
  return isPublicMembershipLevelsEnabled() ? "/upgrade" : "/program";
}

/**
 * Membership needed for org-trial locked surfaces (matches access-shared gates).
 * Core-band content is already unlocked on ORG_TRIAL, so locked items are Plus+
 * (or All-Access / 12-Week for recruiting).
 */
export function getOrgTrialJanuaryUnlockMembershipForSurface(
  surface: OrgTrialLockedContentSurface,
): OrgTrialJanuaryUnlockMembership {
  switch (surface) {
    case "drill":
    case "workout":
    case "playbook":
    case "guide":
    case "messaging":
      return "PLUS";
    case "recruiting":
    case "mixed":
      return "MEMBERSHIP";
    default:
      return "MEMBERSHIP";
  }
}

export function getOrgTrialLockedContentMessage(
  surface: OrgTrialLockedContentSurface = "mixed",
): string {
  if (surface === "recruiting") {
    return ORG_TRIAL_RECRUITING_LOCK_LABEL;
  }
  return getOrgTrialJanuaryUnlockLabel(
    getOrgTrialJanuaryUnlockMembershipForSurface(surface),
  );
}

export function getOrgTrialLockedContentHref(
  surface: OrgTrialLockedContentSurface = "mixed",
): string {
  if (surface === "recruiting") {
    return ORG_TRIAL_RECRUITING_LOCK_HREF;
  }
  return getOrgTrialJanuaryMembershipHref();
}
