/**
 * User-facing and admin plan labels (client-safe).
 */

import { formatEffectiveAccessLabel, type AccessUserFields } from "@/lib/access-shared";
import { formatDatabaseTierLabel, type DatabaseTier } from "@/lib/membership";

/** Single effective plan label everywhere in the app. */
export function formatMemberPlanLabel(user: AccessUserFields, now = new Date()): string {
  return formatEffectiveAccessLabel(user, now);
}

/** Admin list/detail primary pill (effective plan only). */
export function formatAdminMemberPlanLabel(user: AccessUserFields, now = new Date()): string {
  return formatEffectiveAccessLabel(user, now);
}

/** Admin member detail: Stripe/legacy tier row under the plan pill. */
export function formatAdminBaseTierLabel(tier: DatabaseTier): string {
  return formatDatabaseTierLabel(tier);
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
