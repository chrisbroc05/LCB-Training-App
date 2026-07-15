import type { DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export const MEMORABLE_MONTHLY_LIMIT = 2;
export const ELITE_MONTHLY_LIMIT = 4;
export const ELITE_ROLLOVER_CAP = 8;
export const ELITE_TOTAL_AVAILABLE_CAP = 8;

export type CoachingSubmissionLockReason = "basic" | "free-used" | "monthly-limit" | null;

export type CoachingSubmissionUserFields = {
  membershipTier: DatabaseTier;
  freeSubmissionUsed: boolean;
  coachingSubmissionsUsedThisMonth: number;
  coachingSubmissionPeriod: string | null;
  eliteRolloverCredits: number;
};

export type CoachingSubmissionAvailability = {
  canSubmit: boolean;
  lockReason: CoachingSubmissionLockReason;
  remaining: number;
  monthlyRemaining: number | null;
  rolloverCredits: number | null;
  monthlyLimit: number | null;
  periodKey: string;
  resetsOnLabel: string;
};

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

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function getNextCoachingSubmissionResetLabel(date = new Date()) {
  const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(nextMonth);
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

  if (syncedUser.membershipTier === "BASIC") {
    return {
      canSubmit: false,
      lockReason: "basic",
      remaining: 0,
      monthlyRemaining: null,
      rolloverCredits: null,
      monthlyLimit: null,
      periodKey,
      resetsOnLabel,
    };
  }

  if (syncedUser.membershipTier === "FREE") {
    const remaining = syncedUser.freeSubmissionUsed ? 0 : 1;
    return {
      canSubmit: remaining > 0,
      lockReason: syncedUser.freeSubmissionUsed ? "free-used" : null,
      remaining,
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

export async function ensureCoachingSubmissionPeriod(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membershipTier: true,
      freeSubmissionUsed: true,
      coachingSubmissionsUsedThisMonth: true,
      coachingSubmissionPeriod: true,
      eliteRolloverCredits: true,
    },
  });

  if (!user) {
    return null;
  }

  const currentFields: CoachingSubmissionUserFields = {
    membershipTier: user.membershipTier as DatabaseTier,
    freeSubmissionUsed: user.freeSubmissionUsed,
    coachingSubmissionsUsedThisMonth: user.coachingSubmissionsUsedThisMonth,
    coachingSubmissionPeriod: user.coachingSubmissionPeriod,
    eliteRolloverCredits: user.eliteRolloverCredits,
  };

  const periodKey = getCoachingSubmissionPeriodKey();
  const syncedFields = applyPeriodResetIfNeeded(currentFields, periodKey);

  if (
    syncedFields.coachingSubmissionPeriod !== currentFields.coachingSubmissionPeriod ||
    syncedFields.coachingSubmissionsUsedThisMonth !==
      currentFields.coachingSubmissionsUsedThisMonth ||
    syncedFields.eliteRolloverCredits !== currentFields.eliteRolloverCredits
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        coachingSubmissionPeriod: syncedFields.coachingSubmissionPeriod,
        coachingSubmissionsUsedThisMonth: syncedFields.coachingSubmissionsUsedThisMonth,
        eliteRolloverCredits: syncedFields.eliteRolloverCredits,
      },
    });
  }

  return syncedFields;
}

type CoachingSubmissionTransactionClient = Pick<
  typeof prisma,
  "user" | "swingAnalysisSubmission" | "mentalGameSubmission"
>;

export async function consumeCoachingSubmission(
  tx: CoachingSubmissionTransactionClient,
  userId: string,
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      membershipTier: true,
      freeSubmissionUsed: true,
      coachingSubmissionsUsedThisMonth: true,
      coachingSubmissionPeriod: true,
      eliteRolloverCredits: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const periodKey = getCoachingSubmissionPeriodKey();
  const syncedUser = applyPeriodResetIfNeeded(
    {
      membershipTier: user.membershipTier as DatabaseTier,
      freeSubmissionUsed: user.freeSubmissionUsed,
      coachingSubmissionsUsedThisMonth: user.coachingSubmissionsUsedThisMonth,
      coachingSubmissionPeriod: user.coachingSubmissionPeriod,
      eliteRolloverCredits: user.eliteRolloverCredits,
    },
    periodKey,
  );

  const availability = getCoachingSubmissionAvailability(syncedUser);
  if (!availability.canSubmit) {
    return { ok: false as const, availability, membershipTier: syncedUser.membershipTier };
  }

  if (syncedUser.membershipTier === "FREE") {
    await tx.user.update({
      where: { id: userId },
      data: {
        freeSubmissionUsed: true,
        coachingSubmissionPeriod: syncedUser.coachingSubmissionPeriod,
        coachingSubmissionsUsedThisMonth: syncedUser.coachingSubmissionsUsedThisMonth,
        eliteRolloverCredits: syncedUser.eliteRolloverCredits,
      },
    });
    return { ok: true as const, availability, membershipTier: syncedUser.membershipTier };
  }

  if (syncedUser.membershipTier === "MEMORABLE") {
    await tx.user.update({
      where: { id: userId },
      data: {
        coachingSubmissionPeriod: syncedUser.coachingSubmissionPeriod,
        coachingSubmissionsUsedThisMonth: syncedUser.coachingSubmissionsUsedThisMonth + 1,
        eliteRolloverCredits: 0,
      },
    });
    return { ok: true as const, availability, membershipTier: syncedUser.membershipTier };
  }

  if (syncedUser.membershipTier === "ELITE") {
    const useMonthlyAllowance =
      syncedUser.coachingSubmissionsUsedThisMonth < ELITE_MONTHLY_LIMIT;

    await tx.user.update({
      where: { id: userId },
      data: {
        coachingSubmissionPeriod: syncedUser.coachingSubmissionPeriod,
        coachingSubmissionsUsedThisMonth: useMonthlyAllowance
          ? syncedUser.coachingSubmissionsUsedThisMonth + 1
          : syncedUser.coachingSubmissionsUsedThisMonth,
        eliteRolloverCredits: useMonthlyAllowance
          ? syncedUser.eliteRolloverCredits
          : syncedUser.eliteRolloverCredits - 1,
      },
    });
    return { ok: true as const, availability, membershipTier: syncedUser.membershipTier };
  }

  return {
    ok: false as const,
    availability,
    membershipTier: syncedUser.membershipTier,
  };
}

export function getCoachingSubmissionLimitError(
  membershipTier: DatabaseTier,
  lockReason: CoachingSubmissionLockReason,
) {
  if (membershipTier === "BASIC") {
    return "Coaching submissions require Memorable or Elite membership.";
  }

  if (lockReason === "free-used") {
    return "Your one free submission has already been used. Please upgrade to continue.";
  }

  if (lockReason === "monthly-limit") {
    return "You have used all coaching submissions for this month. Your count resets on the 1st.";
  }

  return "You cannot submit a coaching request right now.";
}
