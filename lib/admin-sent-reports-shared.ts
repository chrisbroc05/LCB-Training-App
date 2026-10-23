/**
 * Admin sent written reports list and filters (client-safe).
 */

import type { CoachingReviewTrack } from "@prisma/client";
import { REPORT_RECOMMENDED_FIX_IT_OPTIONS } from "@/lib/player-evaluation-cta-shared";

export const ADMIN_SENT_REPORT_LEVEL_FILTERS = ["all", "core", "org_trial", "free"] as const;

export type AdminSentReportLevelFilter = (typeof ADMIN_SENT_REPORT_LEVEL_FILTERS)[number];

export function reviewTrackForSentLevelFilter(
  level: AdminSentReportLevelFilter,
): CoachingReviewTrack | null {
  if (level === "core") {
    return "QUICK_SIX_WEEK";
  }
  if (level === "org_trial") {
    return "ORG_TRIAL_QUICK";
  }
  if (level === "free") {
    return "FREE_ONCE";
  }
  return null;
}

export function formatTurnaroundDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "--";
  }
  const totalMinutes = Math.round(durationMs / (1000 * 60));
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 48) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function parseAdminSentReportLevelFilter(value: string | null): AdminSentReportLevelFilter {
  const normalized = (value ?? "all").trim().toLowerCase();
  if ((ADMIN_SENT_REPORT_LEVEL_FILTERS as readonly string[]).includes(normalized)) {
    return normalized as AdminSentReportLevelFilter;
  }
  return "all";
}

export function fixItSlugToLabel(slug: string | null | undefined): string | null {
  if (!slug) {
    return null;
  }
  const match = REPORT_RECOMMENDED_FIX_IT_OPTIONS.find((option) => option.value === slug);
  return match?.label ?? slug;
}
