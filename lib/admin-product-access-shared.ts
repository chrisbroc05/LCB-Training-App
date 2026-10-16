/**
 * Admin product grant/remove types and display helpers (client-safe: no server imports).
 */

import type { DatabaseTier } from "@/lib/membership";
import {
  canAccessDrillLibrary,
  canAccessPlaybook,
  canAccessWorkoutPrograms,
  isTwelveWeekProgramMember,
} from "@/lib/membership";

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
): MemberProductAccessSummary {
  const lines: string[] = [];

  if (canAccessPlaybook(membershipTier)) {
    lines.push("The Next Level Playbook");
  }
  if (canAccessDrillLibrary(membershipTier)) {
    lines.push("Full drill library");
  }
  if (canAccessWorkoutPrograms(membershipTier)) {
    lines.push("Workout PDFs and bonus resources");
  }
  if (membershipTier === "BASIC") {
    lines.push("2 lifetime coaching submissions (swing or video breakdowns)");
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

export function formatMemberProductAccessCompact(membershipTier: DatabaseTier): string {
  const parts: string[] = [];
  if (canAccessPlaybook(membershipTier)) {
    parts.push("Playbook");
  }
  if (canAccessDrillLibrary(membershipTier)) {
    parts.push("Drills");
  }
  if (canAccessWorkoutPrograms(membershipTier)) {
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
