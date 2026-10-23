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
  | null;

export type CoachingSubmissionUserFields = AccessUserFields & {
  freeSubmissionUsed: boolean;
  playbookSubmissionsUsed: number;
  coachingSubmissionsUsedThisMonth: number;
  coachingSubmissionPeriod: string | null;
  eliteRolloverCredits: number;
};

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

export function getCoachingSubmissionAvailability(
  user: CoachingSubmissionUserFields,
  now = new Date(),
): CoachingSubmissionAvailability {
  const periodKey = getCoachingSubmissionPeriodKey(now);
  const syncedUser = applyPeriodResetIfNeeded(user, periodKey);
  const resetsOnLabel = getNextCoachingSubmissionResetLabel(now);
  const effective = resolveEffectiveLevel(syncedUser, now);

  if (effective === "PLUS") {
    const monthlyLimit = 1;
    const monthlyRemaining = Math.max(0, monthlyLimit - syncedUser.coachingSubmissionsUsedThisMonth);
    return {
      canSubmit: monthlyRemaining > 0,
      lockReason: monthlyRemaining > 0 ? null : "monthly-limit",
      remaining: monthlyRemaining,
      lifetimeLimit: null,
      monthlyRemaining,
      rolloverCredits: null,
      monthlyLimit,
      periodKey,
      resetsOnLabel,
    };
  }

  if (effective === "CORE") {
    return {
      canSubmit: true,
      lockReason: null,
      remaining: 1,
      lifetimeLimit: null,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel: "every 6 weeks",
    };
  }

  if (syncedUser.membershipTier === "TWELVE_WEEK" || effective === "ALL_ACCESS") {
    return {
      canSubmit: true,
      lockReason: null,
      remaining: 999,
      lifetimeLimit: null,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel,
    };
  }

  if (syncedUser.membershipTier === "BASIC") {
    const used = Math.max(0, syncedUser.playbookSubmissionsUsed);
    const lifetimeLimit =
      getPlaybookLifetimeSubmissionLimit({
        membershipTier: syncedUser.membershipTier,
        playbookLegacyAccess: syncedUser.playbookLegacyAccess,
      }) ?? PLAYBOOK_LIFETIME_SUBMISSION_LIMIT_NEW;
    const remaining = Math.max(0, lifetimeLimit - used);
    return {
      canSubmit: remaining > 0,
      lockReason: remaining > 0 ? null : "playbook-used",
      remaining,
      lifetimeLimit,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel,
    };
  }

  if (syncedUser.membershipTier === "FREE") {
    const remaining = syncedUser.freeSubmissionUsed ? 0 : FREE_LIFETIME_SUBMISSION_LIMIT;
    return {
      canSubmit: remaining > 0,
      lockReason: syncedUser.freeSubmissionUsed ? "free-used" : null,
      remaining,
      lifetimeLimit: FREE_LIFETIME_SUBMISSION_LIMIT,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel,
    };
  }

  if (syncedUser.membershipTier === "MEMORABLE") {
    const monthlyRemaining = Math.max(
      0,
      MEMORABLE_MONTHLY_LIMIT - syncedUser.coachingSubmissionsUsedThisMonth,
    );

    return {
      canSubmit: monthlyRemaining > 0,
      lockReason: monthlyRemaining > 0 ? null : "monthly-limit",
      remaining: monthlyRemaining,
      lifetimeLimit: null,
      monthlyRemaining,
      rolloverCredits: null,
      monthlyLimit: MEMORABLE_MONTHLY_LIMIT,
      periodKey,
      resetsOnLabel,
    };
  }

  const monthlyRemaining = Math.max(
    0,
    ELITE_MONTHLY_LIMIT - syncedUser.coachingSubmissionsUsedThisMonth,
  );
  const remaining = Math.min(
    ELITE_TOTAL_AVAILABLE_CAP,
    monthlyRemaining + syncedUser.eliteRolloverCredits,
  );

  return {
    canSubmit: remaining > 0,
    lockReason: remaining > 0 ? null : "monthly-limit",
    remaining,
    lifetimeLimit: null,
    monthlyRemaining,
    rolloverCredits: syncedUser.eliteRolloverCredits,
    monthlyLimit: ELITE_MONTHLY_LIMIT,
    periodKey,
    resetsOnLabel,
  };
}

export function canSubmitCoachingForms(user: CoachingSubmissionUserFields) {
  return getCoachingSubmissionAvailability(user).canSubmit;
}

export function getCoachingSubmissionLockReason(
  user: CoachingSubmissionUserFields,
): CoachingSubmissionLockReason {
  return getCoachingSubmissionAvailability(user).lockReason;
}
