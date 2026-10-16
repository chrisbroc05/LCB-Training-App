import type { DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import {
  ELITE_MONTHLY_LIMIT,
  ELITE_ROLLOVER_CAP,
  type CoachingSubmissionAvailability,
  type CoachingSubmissionLockReason,
  type CoachingSubmissionUserFields,
  getCoachingSubmissionAvailability,
  getCoachingSubmissionLockReason,
  getCoachingSubmissionPeriodKey,
  canSubmitCoachingForms,
} from "@/lib/coaching-submissions-shared";

export {
  FREE_LIFETIME_SUBMISSION_LIMIT,
  PLAYBOOK_LIFETIME_SUBMISSION_LIMIT,
  MEMORABLE_MONTHLY_LIMIT,
  ELITE_MONTHLY_LIMIT,
  ELITE_ROLLOVER_CAP,
  ELITE_TOTAL_AVAILABLE_CAP,
  canAccessCoachingSubmissionForms,
  formatPlaybookSubmissionQuotaLabel,
  PLAYBOOK_SUBMISSIONS_EXHAUSTED_MESSAGE,
  PLAYBOOK_SUBMISSIONS_INCLUDED_COPY,
  getCoachingSubmissionPeriodKey,
  getCoachingSubmissionPeriodLabel,
  getNextCoachingSubmissionResetLabel,
  getCoachingSubmissionAvailability,
  canSubmitCoachingForms,
  getCoachingSubmissionLockReason,
  type CoachingSubmissionAvailability,
  type CoachingSubmissionLockReason,
  type CoachingSubmissionUserFields,
} from "@/lib/coaching-submissions-shared";

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

const coachingSubmissionUserSelect = {
  membershipTier: true,
  freeSubmissionUsed: true,
  playbookSubmissionsUsed: true,
  coachingSubmissionsUsedThisMonth: true,
  coachingSubmissionPeriod: true,
  eliteRolloverCredits: true,
} as const;

function toCoachingSubmissionUserFields(user: {
  membershipTier: string;
  freeSubmissionUsed: boolean;
  playbookSubmissionsUsed: number;
  coachingSubmissionsUsedThisMonth: number;
  coachingSubmissionPeriod: string | null;
  eliteRolloverCredits: number;
}): CoachingSubmissionUserFields {
  return {
    membershipTier: user.membershipTier as DatabaseTier,
    freeSubmissionUsed: user.freeSubmissionUsed,
    playbookSubmissionsUsed: user.playbookSubmissionsUsed,
    coachingSubmissionsUsedThisMonth: user.coachingSubmissionsUsedThisMonth,
    coachingSubmissionPeriod: user.coachingSubmissionPeriod,
    eliteRolloverCredits: user.eliteRolloverCredits,
  };
}

export async function ensureCoachingSubmissionPeriod(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: coachingSubmissionUserSelect,
  });

  if (!user) {
    return null;
  }

  const currentFields = toCoachingSubmissionUserFields(user);
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
    select: coachingSubmissionUserSelect,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const periodKey = getCoachingSubmissionPeriodKey();
  const syncedUser = applyPeriodResetIfNeeded(toCoachingSubmissionUserFields(user), periodKey);

  const availability = getCoachingSubmissionAvailability(syncedUser);
  if (!availability.canSubmit) {
    return { ok: false as const, availability, membershipTier: syncedUser.membershipTier };
  }

  if (syncedUser.membershipTier === "TWELVE_WEEK") {
    await tx.user.update({
      where: { id: userId },
      data: {
        coachingSubmissionPeriod: syncedUser.coachingSubmissionPeriod,
        coachingSubmissionsUsedThisMonth: syncedUser.coachingSubmissionsUsedThisMonth,
        eliteRolloverCredits: syncedUser.eliteRolloverCredits,
      },
    });
    return { ok: true as const, availability, membershipTier: syncedUser.membershipTier };
  }

  if (syncedUser.membershipTier === "BASIC") {
    await tx.user.update({
      where: { id: userId },
      data: {
        playbookSubmissionsUsed: syncedUser.playbookSubmissionsUsed + 1,
        coachingSubmissionPeriod: syncedUser.coachingSubmissionPeriod,
        coachingSubmissionsUsedThisMonth: syncedUser.coachingSubmissionsUsedThisMonth,
        eliteRolloverCredits: syncedUser.eliteRolloverCredits,
      },
    });
    return { ok: true as const, availability, membershipTier: syncedUser.membershipTier };
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
  if (lockReason === "playbook-used") {
    return "You have used both Playbook coaching submissions.";
  }

  if (lockReason === "free-used") {
    return "Your one free submission has already been used. Please upgrade to continue.";
  }

  if (lockReason === "monthly-limit") {
    return "You have used all coaching submissions for this month. Your count resets on the 1st.";
  }

  if (membershipTier === "BASIC") {
    return "You cannot submit a coaching request right now.";
  }

  return "You cannot submit a coaching request right now.";
}

export function getPlaybookSubmissionResetData() {
  return { playbookSubmissionsUsed: 0 };
}
