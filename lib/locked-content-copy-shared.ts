/**
 * Locked content messaging (client-safe).
 */

import type { EffectiveAccessLevel } from "@/lib/access-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  getUpgradeLabelForLevel,
  isPublicMembershipLevelsEnabled,
} from "@/lib/membership-levels-shared";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";

function isCoreBand(effective: EffectiveAccessLevel): boolean {
  return effective === "CORE" || effective === "ORG_TRIAL";
}

function isLevelMember(effective: EffectiveAccessLevel): boolean {
  return (
    effective === "PLUS" ||
    effective === "ALL_ACCESS" ||
    effective === "TWELVE_WEEK" ||
    effective === "LEGACY_ELITE" ||
    effective === "LEGACY_MEMORABLE"
  );
}

export const HIGHER_MEMBERSHIP_LOCKED_MESSAGE =
  "This is part of a higher membership level. Questions? Message Coach Broc or email chrisbroc05@gmail.com.";

export const PLAYBOOK_BUYER_LOCKED_DRILL_MESSAGE = `Unlocks with the 12-Week Program. Already own ${PLAYBOOK_NAME}? Use code STARTER25 at checkout.`;

export function getLockedContentMessage(
  effective: EffectiveAccessLevel,
  _surface: "drill" | "workout" | "playbook" | "guide",
  requiredLevel?: MembershipLevelKey,
): string {
  if (effective === "FREE" || effective === "PLAYBOOK") {
    return PLAYBOOK_BUYER_LOCKED_DRILL_MESSAGE;
  }

  if (isCoreBand(effective) || isLevelMember(effective)) {
    if (isPublicMembershipLevelsEnabled() && requiredLevel) {
      return getUpgradeLabelForLevel(requiredLevel);
    }
    return HIGHER_MEMBERSHIP_LOCKED_MESSAGE;
  }

  return PLAYBOOK_BUYER_LOCKED_DRILL_MESSAGE;
}

export function shouldShowPlaybookStarterPromo(effective: EffectiveAccessLevel): boolean {
  return effective === "PLAYBOOK" || effective === "FREE";
}
