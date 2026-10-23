/**
 * User-facing and admin plan labels (client-safe).
 */

import {
  formatEffectiveAccessLabel,
  resolveEffectiveLevel,
  type AccessUserFields,
} from "@/lib/access-shared";
import { formatDatabaseTierLabel, type DatabaseTier } from "@/lib/membership";
import {
  formatMembershipLevelLabel,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";

function isActiveMembershipLevelKey(
  user: AccessUserFields,
  now = new Date(),
): MembershipLevelKey | null {
  const effective = resolveEffectiveLevel(user, now);
  if (effective === "CORE" || effective === "PLUS" || effective === "ALL_ACCESS") {
    return effective;
  }
  return null;
}

/** Label shown in the app (upgrade sheet, profile, etc.). */
export function formatMemberPlanLabel(user: AccessUserFields, now = new Date()): string {
  return formatEffectiveAccessLabel(user, now);
}

/** Admin list/detail, e.g. "Free + Core" with optional expiry line. */
export function formatAdminMemberPlanLabel(user: AccessUserFields, now = new Date()): string {
  const tierLabel = formatDatabaseTierLabel(user.membershipTier);
  const activeLevel = isActiveMembershipLevelKey(user, now);

  if (activeLevel && user.membershipTier === "FREE") {
    return `${tierLabel} + ${formatMembershipLevelLabel(activeLevel)}`;
  }

  if (activeLevel && user.membershipTier !== "FREE") {
    return `${tierLabel} + ${formatMembershipLevelLabel(activeLevel)}`;
  }

  return formatEffectiveAccessLabel(user, now);
}

export function formatAdminMembershipLevelExpiry(
  expiresAt: Date | string | null | undefined,
  now = new Date(),
): string | null {
  if (!expiresAt) {
    return null;
  }
  const parsed = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  if (parsed.getTime() <= now.getTime()) {
    return "Expired";
  }
  return `Expires ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}
