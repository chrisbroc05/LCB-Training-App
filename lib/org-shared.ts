/**
 * Organization display and validation (client-safe).
 */

import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

export type OrgBillingModeKey = "FAMILY_PAY" | "CLUB_PAY";

export function normalizeOrgJoinCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isOrgBillingMode(value: string): value is OrgBillingModeKey {
  return value === "FAMILY_PAY" || value === "CLUB_PAY";
}

export function formatOrgBillingModeLabel(mode: OrgBillingModeKey): string {
  if (mode === "CLUB_PAY") {
    return "Club pay";
  }
  return "Family pay";
}

export function formatOrgCoveredLevelLabel(level: MembershipLevelKey | null | undefined): string {
  if (!level) {
    return "None";
  }
  if (level === "CORE") {
    return "Core";
  }
  if (level === "PLUS") {
    return "Plus";
  }
  return "All-Access";
}

export function isOrgTrialWindowActive(
  trialStartsAt: Date | string | null | undefined,
  trialEndsAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  const start = trialStartsAt ? new Date(trialStartsAt) : null;
  const end = trialEndsAt ? new Date(trialEndsAt) : null;
  if (!start || !end) {
    return false;
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }
  const t = now.getTime();
  return t >= start.getTime() && t <= end.getTime();
}
