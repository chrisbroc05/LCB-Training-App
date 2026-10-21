/**
 * Admin product grant/remove types and display helpers (client-safe: no server imports).
 */

import type { DatabaseTier } from "@/lib/membership";
import {
  canAccessDrillLibrary,
  canAccessFullDrillLibrary,
  canAccessPlaybook,
  canAccessWorkoutPrograms,
  isTwelveWeekProgramMember,
} from "@/lib/membership";
import {
  getPlaybookLifetimeSubmissionLimit,
  PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW,
} from "@/lib/playbook-entitlements-shared";

export const ADMIN_GRANT_PRODUCTS = [
  "playbook",
  "remote_session",
  "twelve_week_program",
] as const;

export type AdminGrantProduct = (typeof ADMIN_GRANT_PRODUCTS)[number];

export function isAdminGrantProduct(value: string): value is AdminGrantProduct {
  return (ADMIN_GRANT_PRODUCTS as readonly string[]).includes(value);
}

export function getAdminGrantProductLabel(product: AdminGrantProduct): string {
  if (product === "playbook") {
    return "The Playbook";
  }
  if (product === "remote_session") {
    return "Remote Session";
  }
  return "12-Week Program";
}

export type MemberProductAccessSummary = {
  membershipTier: DatabaseTier;
  tierLabel: string;
  productLines: string[];
};

export function buildMemberProductAccessSummary(
  membershipTier: DatabaseTier,
  tierLabel: string,
  playbookLegacyAccess = false,
): MemberProductAccessSummary {
  const lines: string[] = [];

  if (canAccessPlaybook(membershipTier)) {
    lines.push("The Next Level Playbook");
  }
  if (canAccessFullDrillLibrary(membershipTier, playbookLegacyAccess)) {
    lines.push("Full drill library");
  } else if (membershipTier === "BASIC") {
    lines.push("Starter drill set from the library");
  }
  if (canAccessWorkoutPrograms(membershipTier, playbookLegacyAccess)) {
    lines.push("Workout PDFs and bonus resources");
  } else if (membershipTier === "BASIC") {
    lines.push("Four Playbook guides (Mental, Pregame, Parent, Nutrition)");
  }
  if (membershipTier === "BASIC") {
    const limit =
      getPlaybookLifetimeSubmissionLimit({ membershipTier, playbookLegacyAccess }) ??
      PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW;
    lines.push(
      `${limit} lifetime coaching submission${limit === 1 ? "" : "s"} (swing or video breakdown)`,
    );
    if (playbookLegacyAccess) {
      lines.push("Full Playbook (legacy access)");
    }
  }
  if (isTwelveWeekProgramMember(membershipTier)) {
    lines.push("12-Week daily plan and program dashboard");
    lines.push("Unlimited coaching submissions");
    lines.push("Direct messaging with Coach Broc (when program is active)");
    lines.push("College recruiting guide");
  } else if (membershipTier === "FREE") {
    lines.push("One free coaching submission");
  } else if (membershipTier === "MEMORABLE" || membershipTier === "ELITE") {
    lines.push("Monthly coaching submissions (Memorable/Elite limits)");
    lines.push("Goal check-ins");
  }

  if (lines.length === 0) {
    lines.push("Free tier only");
  }

  return {
    membershipTier,
    tierLabel,
    productLines: lines,
  };
}

export function formatMemberProductAccessCompact(
  membershipTier: DatabaseTier,
  playbookLegacyAccess = false,
): string {
  const parts: string[] = [];
  if (canAccessPlaybook(membershipTier)) {
    parts.push("Playbook");
  }
  if (canAccessFullDrillLibrary(membershipTier, playbookLegacyAccess)) {
    parts.push("Drills");
  } else if (canAccessDrillLibrary(membershipTier)) {
    parts.push("Starter drills");
  }
  if (canAccessWorkoutPrograms(membershipTier, playbookLegacyAccess)) {
    parts.push("Workouts");
  }
  if (isTwelveWeekProgramMember(membershipTier)) {
    parts.push("12-Week");
  }
  if (parts.length === 0) {
    return "Free";
  }
  return parts.join(", ");
}
