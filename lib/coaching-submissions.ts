import type { CoachingReviewTrack } from "@prisma/client";
import { resolveEffectiveLevel } from "@/lib/access-shared";
import type { DatabaseTier } from "@/lib/membership";
import { mergeOrgIntoAccessFields } from "@/lib/org-server";
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
  getPlaybookSubmissionAllowance,
  canSubmitCoachingForms,
} from "@/lib/coaching-submissions-shared";
import type { FreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-shared";
import { getFreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-server";
import { getReportsQueueReviewTracks } from "@/lib/reports-queue-shared";
import {
  isPoolEligibleNow,
  poolIdToReviewTrack,
  type CoachingAllowancePoolId,
} from "@/lib/coaching-submission-pool-shared";

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
  playbookLegacyAccess: true,
  membershipLevel: true,
  membershipLevelExpiresAt: true,
  freeSubmissionUsed: true,
  playbookSubmissionsUsed: true,
  coachingSubmissionsUsedThisMonth: true,
  coachingSubmissionPeriod: true,
  eliteRolloverCredits: true,
  organizationId: true,
  orgTrialQuickReportUsed: true,
  coreQuickReportNextEligibleAt: true,
  organization: {
    select: {
      active: true,
      billingMode: true,
      coveredLevel: true,
      trialStartsAt: true,
      trialEndsAt: true,
    },
  },
} as const;

function toCoachingSubmissionUserFields(
  user: Parameters<typeof mergeOrgIntoAccessFields>[0] & {
    freeSubmissionUsed: boolean;
    playbookSubmissionsUsed: number;
    coachingSubmissionsUsedThisMonth: number;
    coachingSubmissionPeriod: string | null;
    eliteRolloverCredits: number;
  },
): CoachingSubmissionUserFields {
  return {
    ...mergeOrgIntoAccessFields(user),
    freeSubmissionUsed: user.freeSubmissionUsed,
    playbookSubmissionsUsed: user.playbookSubmissionsUsed,
    coachingSubmissionsUsedThisMonth: user.coachingSubmissionsUsedThisMonth,
    coachingSubmissionPeriod: user.coachingSubmissionPeriod,
    eliteRolloverCredits: user.eliteRolloverCredits,
  };
}

const SIX_WEEKS_MS = 6 * 7 * 24 * 60 * 60 * 1000;

export async function getCoachingSubmissionAvailabilityForUser(userId: string) {
  const fields = await ensureCoachingSubmissionPeriod(userId);
  if (!fields) {
    return null;
  }

  const freeSwingMode = await getFreeSwingAnalysisResponseMode();
  const hasPendingQuickWrittenReport = await userHasPendingReportsQueueSubmission(
    userId,
    freeSwingMode,
  );
  return getCoachingSubmissionAvailability(fields, new Date(), {
    hasPendingQuickWrittenReport,
  });
}

export async function userHasPendingReportsQueueSubmission(
  userId: string,
  freeSwingMode?: FreeSwingAnalysisResponseMode,
) {
  const mode = freeSwingMode ?? (await getFreeSwingAnalysisResponseMode());
  const queueTracks = getReportsQueueReviewTracks(mode);
  const pending = await prisma.swingAnalysisSubmission.findFirst({
    where: {
      userId,
      status: "PENDING",
      reviewTrack: { in: queueTracks },
    },
    select: { id: true },
  });
  return Boolean(pending);
}

/** @deprecated Use userHasPendingReportsQueueSubmission */
export async function userHasPendingQuickWrittenReport(userId: string) {
  return userHasPendingReportsQueueSubmission(userId);
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

async function consumeFromRequestedPool(
  tx: CoachingSubmissionTransactionClient,
  userId: string,
  syncedUser: CoachingSubmissionUserFields,
  poolId: CoachingAllowancePoolId,
  periodSync: {
    coachingSubmissionPeriod: string | null;
    coachingSubmissionsUsedThisMonth: number;
    eliteRolloverCredits: number;
  },
  freeSwingMode: FreeSwingAnalysisResponseMode,
  availability: CoachingSubmissionAvailability,
) {
  if (!isPoolEligibleNow(syncedUser, poolId)) {
    return { ok: false as const, availability, membershipTier: syncedUser.membershipTier };
  }

  const reviewTrack = poolIdToReviewTrack(poolId);

  if (poolId === "playbook-lifetime") {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...periodSync,
        playbookSubmissionsUsed: syncedUser.playbookSubmissionsUsed + 1,
      },
    });
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "PLAYBOOK" as CoachingReviewTrack,
    };
  }

  if (poolId === "core-six-week" || poolId === "org-trial") {
    await tx.user.update({ where: { id: userId }, data: periodSync });
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack,
    };
  }

  if (poolId === "plus-monthly" || poolId === "legacy-monthly") {
    const useMonthlyAllowance =
      syncedUser.membershipTier !== "ELITE" ||
      syncedUser.coachingSubmissionsUsedThisMonth < ELITE_MONTHLY_LIMIT;

    await tx.user.update({
      where: { id: userId },
      data: {
        ...periodSync,
        coachingSubmissionsUsedThisMonth: useMonthlyAllowance
          ? syncedUser.coachingSubmissionsUsedThisMonth + 1
          : syncedUser.coachingSubmissionsUsedThisMonth,
        eliteRolloverCredits:
          syncedUser.membershipTier === "ELITE" && !useMonthlyAllowance
            ? syncedUser.eliteRolloverCredits - 1
            : syncedUser.eliteRolloverCredits,
      },
    });
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "IN_DEPTH_MONTHLY" as CoachingReviewTrack,
    };
  }

  if (poolId === "program") {
    await tx.user.update({ where: { id: userId }, data: periodSync });
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "PROGRAM" as CoachingReviewTrack,
    };
  }

  if (poolId === "free-once") {
    await tx.user.update({ where: { id: userId }, data: periodSync });
    const freeTrack: CoachingReviewTrack | null =
      freeSwingMode === "WRITTEN_REPORT" ? "FREE_ONCE" : null;
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: freeTrack,
    };
  }

  return { ok: false as const, availability, membershipTier: syncedUser.membershipTier };
}

export async function consumeCoachingSubmission(
  tx: CoachingSubmissionTransactionClient,
  userId: string,
  options?: {
    freeSwingAnalysisResponseMode?: FreeSwingAnalysisResponseMode;
    requestedPool?: CoachingAllowancePoolId;
  },
) {
  const freeSwingMode =
    options?.freeSwingAnalysisResponseMode ?? (await getFreeSwingAnalysisResponseMode());
  const reportsQueueTracks = getReportsQueueReviewTracks(freeSwingMode);
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: coachingSubmissionUserSelect,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const periodKey = getCoachingSubmissionPeriodKey();
  const syncedUser = applyPeriodResetIfNeeded(toCoachingSubmissionUserFields(user), periodKey);

  const pendingQuick = await tx.swingAnalysisSubmission.findFirst({
    where: {
      userId,
      status: "PENDING",
      reviewTrack: { in: reportsQueueTracks },
    },
    select: { id: true },
  });
  const hasPendingQuickWrittenReport = Boolean(pendingQuick);

  const availability = getCoachingSubmissionAvailability(syncedUser, new Date(), {
    hasPendingQuickWrittenReport,
  });
  if (!availability.canSubmit) {
    return { ok: false as const, availability, membershipTier: syncedUser.membershipTier };
  }

  const periodSync = {
    coachingSubmissionPeriod: syncedUser.coachingSubmissionPeriod,
    coachingSubmissionsUsedThisMonth: syncedUser.coachingSubmissionsUsedThisMonth,
    eliteRolloverCredits: syncedUser.eliteRolloverCredits,
  };

  if (options?.requestedPool) {
    return consumeFromRequestedPool(
      tx,
      userId,
      syncedUser,
      options.requestedPool,
      periodSync,
      freeSwingMode,
      availability,
    );
  }

  const effective = resolveEffectiveLevel(syncedUser);

  if (effective === "TWELVE_WEEK" || effective === "ALL_ACCESS") {
    await tx.user.update({ where: { id: userId }, data: periodSync });
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "PROGRAM" as CoachingReviewTrack,
    };
  }

  if (effective === "PLUS") {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...periodSync,
        coachingSubmissionsUsedThisMonth: syncedUser.coachingSubmissionsUsedThisMonth + 1,
        eliteRolloverCredits: 0,
      },
    });
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "IN_DEPTH_MONTHLY" as CoachingReviewTrack,
    };
  }

  if (effective === "CORE") {
    const nextEligible = syncedUser.coreQuickReportNextEligibleAt
      ? new Date(syncedUser.coreQuickReportNextEligibleAt)
      : null;
    const coreCanSubmit = !nextEligible || nextEligible.getTime() <= Date.now();
    if (coreCanSubmit) {
      await tx.user.update({ where: { id: userId }, data: periodSync });
      return {
        ok: true as const,
        availability,
        membershipTier: syncedUser.membershipTier,
        reviewTrack: "QUICK_SIX_WEEK" as CoachingReviewTrack,
      };
    }
    if (syncedUser.membershipTier === "BASIC") {
      const playbook = getPlaybookSubmissionAllowance(syncedUser);
      if (playbook?.canSubmit) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...periodSync,
            playbookSubmissionsUsed: syncedUser.playbookSubmissionsUsed + 1,
          },
        });
        return {
          ok: true as const,
          availability,
          membershipTier: syncedUser.membershipTier,
          reviewTrack: "PLAYBOOK" as CoachingReviewTrack,
        };
      }
    }
    return { ok: false as const, availability, membershipTier: syncedUser.membershipTier };
  }

  if (effective === "ORG_TRIAL") {
    await tx.user.update({ where: { id: userId }, data: periodSync });
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "ORG_TRIAL_QUICK" as CoachingReviewTrack,
    };
  }

  if (effective === "PLAYBOOK") {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...periodSync,
        playbookSubmissionsUsed: syncedUser.playbookSubmissionsUsed + 1,
      },
    });
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "PLAYBOOK" as CoachingReviewTrack,
    };
  }

  if (effective === "FREE") {
    await tx.user.update({ where: { id: userId }, data: periodSync });
    const reviewTrack: CoachingReviewTrack | null =
      freeSwingMode === "WRITTEN_REPORT" ? "FREE_ONCE" : null;
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack,
    };
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
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "IN_DEPTH_MONTHLY" as CoachingReviewTrack,
    };
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
    return {
      ok: true as const,
      availability,
      membershipTier: syncedUser.membershipTier,
      reviewTrack: "IN_DEPTH_MONTHLY" as CoachingReviewTrack,
    };
  }

  return {
    ok: false as const,
    availability,
    membershipTier: syncedUser.membershipTier,
  };
}

export async function applyQuickReportAllowanceOnSend(
  tx: Pick<typeof prisma, "user">,
  userId: string,
  reviewTrack: CoachingReviewTrack,
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
  const periodSync = {
    coachingSubmissionPeriod: syncedUser.coachingSubmissionPeriod,
    coachingSubmissionsUsedThisMonth: syncedUser.coachingSubmissionsUsedThisMonth,
    eliteRolloverCredits: syncedUser.eliteRolloverCredits,
  };

  if (reviewTrack === "QUICK_SIX_WEEK") {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...periodSync,
        coreQuickReportNextEligibleAt: new Date(Date.now() + SIX_WEEKS_MS),
      },
    });
    return;
  }

  if (reviewTrack === "ORG_TRIAL_QUICK") {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...periodSync,
        orgTrialQuickReportUsed: true,
      },
    });
    return;
  }

  if (reviewTrack === "FREE_ONCE") {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...periodSync,
        freeSubmissionUsed: true,
      },
    });
  }
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

  if (lockReason === "pending-quick-report") {
    return "Coach Broc is finishing your written report. You can submit again after it is sent.";
  }

  if (membershipTier === "BASIC") {
    return "You cannot submit a coaching request right now.";
  }

  return "You cannot submit a coaching request right now.";
}

export function getPlaybookSubmissionResetData() {
  return { playbookSubmissionsUsed: 0 };
}
