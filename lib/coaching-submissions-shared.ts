/**
 * Coaching submission limits and display helpers (client-safe: no server imports).
 */

import { resolveEffectiveLevel, type AccessUserFields } from "@/lib/access-shared";
import { formatDateWithYear, formatMonthYear } from "@/lib/format-date";
import type { DatabaseTier } from "@/lib/membership";
import {
  getPlaybookLifetimeSubmissionLimit,
  PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW,
} from "@/lib/playbook-entitlements-shared";

/** Default limit for new Playbook (Basic) buyers. */
export const PLAYBOOK_LIFETIME_SUBMISSION_LIMIT = PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW;
export const FREE_LIFETIME_SUBMISSION_LIMIT = 1;

export type CoachingSubmissionLockReason =
  | "playbook-used"
  | "free-used"
  | "monthly-limit"
  | "pending-quick-report"
  | null;

export type CoachingSubmissionUserFields = AccessUserFields & {
  freeSubmissionUsed: boolean;
  playbookSubmissionsUsed: number;
  coachingSubmissionsUsedThisMonth: number;
  coachingSubmissionPeriod: string | null;
  eliteRolloverCredits: number;
};

const SIX_WEEKS_MS = 6 * 7 * 24 * 60 * 60 * 1000;

function parseWhen(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export type CoachingSubmissionAvailability = {
  canSubmit: boolean;
  lockReason: CoachingSubmissionLockReason;
  remaining: number;
  lifetimeLimit: number | null;
  monthlyRemaining: number | null;
  rolloverCredits: number | null;
  monthlyLimit: number | null;
  periodKey: string;
  resetsOnLabel: string;
};

export function canAccessCoachingSubmissionForms(tier: DatabaseTier) {
  return (
    tier === "FREE" ||
    tier === "BASIC" ||
    tier === "TWELVE_WEEK" ||
    tier === "MEMORABLE" ||
    tier === "ELITE"
  );
}

export function formatPlaybookSubmissionQuotaLabel(remaining: number, limit: number) {
  if (remaining <= 0) {
    return `0 of ${limit} coaching submissions left`;
  }
  if (remaining === 1) {
    return "1 coaching submission left";
  }
  return `${remaining} of ${limit} coaching submissions left`;
}

export const PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE =
  "You have used your included submission. Want weekly breakdowns? Check out the 12-Week Program.";

export const PLAYBOOK_SUBMISSIONS_INCLUDED_COPY_NEW =
  "1 personal swing or video breakdown from Coach Broc";

export const PLAYBOOK_SUBMISSIONS_INCLUDED_COPY_LEGACY =
  "2 personal swing or video breakdowns from Coach Broc";

export const PLAYBOOK_SUBMISSIONS_INCLUDED_COPY = PLAYBOOK_SUBMISSIONS_INCLUDED_COPY_NEW;

export const MEMORABLE_MONTHLY_LIMIT = 2;
export const ELITE_MONTHLY_LIMIT = 4;
export const ELITE_ROLLOVER_CAP = 8;
export const ELITE_TOTAL_AVAILABLE_CAP = 8;

export function getCoachingSubmissionPeriodKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getCoachingSubmissionPeriodLabel(periodKey: string) {
  const [year, month] = periodKey.split("-").map(Number);
  if (!year || !month) {
    return periodKey;
  }

  return formatMonthYear(new Date(Date.UTC(year, month - 1, 1)));
}

export function getNextCoachingSubmissionResetLabel(date = new Date()) {
  const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return formatDateWithYear(nextMonth);
}

function applyPeriodResetIfNeeded(
  user: CoachingSubmissionUserFields,
  periodKey = getCoachingSubmissionPeriodKey(),
): CoachingSubmissionUserFields {
  if (user.coachingSubmissionPeriod === periodKey) {
    return user;
  }

  const nextUser: CoachingSubmissionUserFields = {
    ...user,
    coachingSubmissionPeriod: periodKey,
    coachingSubmissionsUsedThisMonth: 0,
  };

  if (user.membershipTier === "ELITE") {
    const unusedMonthly = Math.max(0, ELITE_MONTHLY_LIMIT - user.coachingSubmissionsUsedThisMonth);
    nextUser.eliteRolloverCredits = Math.min(
      ELITE_ROLLOVER_CAP,
      user.eliteRolloverCredits + unusedMonthly,
    );
  } else {
    nextUser.eliteRolloverCredits = 0;
  }

  return nextUser;
}

export type CoachingSubmissionAvailabilityOptions = {
  hasPendingQuickWrittenReport?: boolean;
};

function applyPendingQuickReportLock(
  availability: CoachingSubmissionAvailability,
  hasPendingQuickWrittenReport?: boolean,
): CoachingSubmissionAvailability {
  if (!hasPendingQuickWrittenReport) {
    return availability;
  }

  return {
    ...availability,
    canSubmit: false,
    lockReason: "pending-quick-report",
    remaining: 0,
    monthlyRemaining: availability.monthlyRemaining === null ? null : 0,
  };
}

export function getPlaybookSubmissionAllowance(
  user: CoachingSubmissionUserFields,
  now = new Date(),
): { canSubmit: boolean; remaining: number; limit: number } | null {
  if (user.membershipTier !== "BASIC") {
    return null;
  }
  const used = Math.max(0, user.playbookSubmissionsUsed);
  const lifetimeLimit =
    getPlaybookLifetimeSubmissionLimit({
      membershipTier: user.membershipTier,
      playbookLegacyAccess: user.playbookLegacyAccess,
      membershipLevel: user.membershipLevel,
      membershipLevelExpiresAt: user.membershipLevelExpiresAt,
    }) ?? PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW;
  const remaining = Math.max(0, lifetimeLimit - used);
  return {
    canSubmit: remaining > 0,
    remaining,
    limit: lifetimeLimit,
  };
}

export function getCoachingSubmissionAvailability(
  user: CoachingSubmissionUserFields,
  now = new Date(),
  options?: CoachingSubmissionAvailabilityOptions,
): CoachingSubmissionAvailability {
  const periodKey = getCoachingSubmissionPeriodKey(now);
  const syncedUser = applyPeriodResetIfNeeded(user, periodKey);
  const resetsOnLabel = getNextCoachingSubmissionResetLabel(now);
  const effective = resolveEffectiveLevel(syncedUser, now);
  const finalize = (availability: CoachingSubmissionAvailability) =>
    applyPendingQuickReportLock(availability, options?.hasPendingQuickWrittenReport);

  if (effective === "PLUS") {
    const monthlyLimit = 1;
    const monthlyRemaining = Math.max(0, monthlyLimit - syncedUser.coachingSubmissionsUsedThisMonth);
    return finalize({
      canSubmit: monthlyRemaining > 0,
      lockReason: monthlyRemaining > 0 ? null : "monthly-limit",
      remaining: monthlyRemaining,
      lifetimeLimit: null,
      monthlyRemaining,
      rolloverCredits: null,
      monthlyLimit,
      periodKey,
      resetsOnLabel,
    });
  }

  if (effective === "CORE") {
    const nextEligible = parseWhen(syncedUser.coreQuickReportNextEligibleAt);
    const coreCanSubmit = !nextEligible || nextEligible.getTime() <= now.getTime();
    const playbook = getPlaybookSubmissionAllowance(syncedUser, now);
    const canSubmit = coreCanSubmit || Boolean(playbook?.canSubmit);
    return finalize({
      canSubmit,
      lockReason: canSubmit ? null : "monthly-limit",
      remaining: coreCanSubmit ? 1 : 0,
      lifetimeLimit: null,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel: nextEligible ? formatDateWithYear(nextEligible) : "every 6 weeks",
    });
  }

  if (effective === "ORG_TRIAL") {
    const canSubmit = !syncedUser.orgTrialQuickReportUsed;
    return finalize({
      canSubmit,
      lockReason: canSubmit ? null : "playbook-used",
      remaining: canSubmit ? 1 : 0,
      lifetimeLimit: null,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel: "org trial",
    });
  }

  if (syncedUser.membershipTier === "TWELVE_WEEK" || effective === "ALL_ACCESS") {
    return finalize({
      canSubmit: true,
      lockReason: null,
      remaining: 999,
      lifetimeLimit: null,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel,
    });
  }

  if (syncedUser.membershipTier === "BASIC" && effective === "PLAYBOOK") {
    const playbook = getPlaybookSubmissionAllowance(syncedUser, now);
    const remaining = playbook?.remaining ?? 0;
    const lifetimeLimit = playbook?.limit ?? PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW;
    return finalize({
      canSubmit: Boolean(playbook?.canSubmit),
      lockReason: playbook?.canSubmit ? null : "playbook-used",
      remaining,
      lifetimeLimit,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel,
    });
  }

  if (effective === "FREE" && syncedUser.membershipTier === "FREE") {
    const remaining = syncedUser.freeSubmissionUsed ? 0 : FREE_LIFETIME_SUBMISSION_LIMIT;
    return finalize({
      canSubmit: remaining > 0,
      lockReason: syncedUser.freeSubmissionUsed ? "free-used" : null,
      remaining,
      lifetimeLimit: FREE_LIFETIME_SUBMISSION_LIMIT,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel,
    });
  }

  if (syncedUser.membershipTier === "MEMORABLE") {
    const monthlyRemaining = Math.max(
      0,
      MEMORABLE_MONTHLY_LIMIT - syncedUser.coachingSubmissionsUsedThisMonth,
    );

    return finalize({
      canSubmit: monthlyRemaining > 0,
      lockReason: monthlyRemaining > 0 ? null : "monthly-limit",
      remaining: monthlyRemaining,
      lifetimeLimit: null,
      monthlyRemaining,
      rolloverCredits: null,
      monthlyLimit: MEMORABLE_MONTHLY_LIMIT,
      periodKey,
      resetsOnLabel,
    });
  }

  const monthlyRemaining = Math.max(
    0,
    ELITE_MONTHLY_LIMIT - syncedUser.coachingSubmissionsUsedThisMonth,
  );
  const remaining = Math.min(
    ELITE_TOTAL_AVAILABLE_CAP,
    monthlyRemaining + syncedUser.eliteRolloverCredits,
  );

  return finalize({
    canSubmit: remaining > 0,
    lockReason: remaining > 0 ? null : "monthly-limit",
    remaining,
    lifetimeLimit: null,
    monthlyRemaining,
    rolloverCredits: syncedUser.eliteRolloverCredits,
    monthlyLimit: ELITE_MONTHLY_LIMIT,
    periodKey,
    resetsOnLabel,
  });
}

export function canSubmitCoachingForms(user: CoachingSubmissionUserFields) {
  return getCoachingSubmissionAvailability(user).canSubmit;
}

export function getCoachingSubmissionLockReason(
  user: CoachingSubmissionUserFields,
): CoachingSubmissionLockReason {
  return getCoachingSubmissionAvailability(user).lockReason;
}
