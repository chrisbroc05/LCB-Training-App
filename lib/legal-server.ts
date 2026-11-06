import "server-only";

import { prisma } from "@/lib/prisma";
import {
  isMinorPlayerAge,
  isUnder13PlayerAge,
  LEGAL_DOCS_VERSION,
  needsLegalAcceptance,
  needsUnder13ParentConfirmationLock,
  UNDER13_PARENT_LOCK_MAX_RESENDS_PER_DAY,
  validateParentConsentEmail,
} from "@/lib/legal-shared";
import {
  PARENT_ACCOUNT_SIGNUP_CHECKOUT_DEFERRAL_MS,
  PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
  PARENT_CONSENT_METHOD_EMAIL_CONFIRM,
  PARENT_CONSENT_METHOD_PAYMENT,
  resolveUnder13ParentConsentGateMode,
  shouldFallbackDeferredParentAccountSignup,
  type ParentSignupDeferralFallbackReason,
} from "@/lib/parent-consent-shared";
import { combinePlayerName } from "@/lib/account-shared";
import { getChicagoTodayDateKey } from "@/lib/program-schedule";
import {
  sendParentConsentConfirmEmail,
  sendPlayerParentConfirmedEmail,
} from "@/lib/parent-consent-email";
import { sendPushToUserSafe } from "@/lib/push-send";
import { findMatchingWaiverSignatureForUser } from "@/lib/waiver-sign-server";

export type LegalAcceptanceInput = {
  acceptedByName: string;
  acceptedAsParent: boolean;
  playerAge: number;
  parentConsentName: string | null;
  parentConsentEmail: string | null;
  mediaConsent: boolean;
};

async function applySecondEmailFromParentConsent(userId: string, params: {
  parentConsentName: string;
  parentConsentEmail: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountRole: true,
      email: true,
    },
  });

  if (!user) {
    return;
  }

  const normalizedParentEmail = params.parentConsentEmail.trim().toLowerCase();
  if (
    user.accountRole === "PARENT" ||
    normalizedParentEmail === user.email.trim().toLowerCase()
  ) {
    return;
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId },
    select: {
      id: true,
      parentEmail: true,
    },
  });

  if (!enrollment || enrollment.parentEmail?.trim()) {
    return;
  }

  await prisma.programEnrollment.update({
    where: { id: enrollment.id },
    data: {
      parentName: params.parentConsentName,
      parentEmail: params.parentConsentEmail,
      parentEmailsEnabled: true,
    },
  });
}

async function maybeSendParentConsentEmail(user: {
  id: string;
  name: string | null;
  email: string;
  accountRole: string;
  playerFirstName: string | null;
  playerLastName: string | null;
  acceptedByName: string | null;
  termsAcceptedAt: Date | null;
  parentConsentEmail: string | null;
  parentConsentEmailSentAt: Date | null;
}) {
  if (!user.parentConsentEmail?.trim() || !user.termsAcceptedAt || !user.acceptedByName) {
    return;
  }

  const playerDisplayName =
    combinePlayerName(user.playerFirstName ?? "", user.playerLastName ?? "") || user.name;

  try {
    await sendParentConsentConfirmEmail({
      to: user.parentConsentEmail.trim(),
      userId: user.id,
      playerName: playerDisplayName,
      playerEmail: user.email,
      agreedByName: user.acceptedByName,
      agreedAt: user.termsAcceptedAt,
      audience: user.accountRole === "PARENT" ? "parent_account_holder" : "third_party_parent",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        parentConsentEmailSentAt: new Date(),
        parentConsentReminderSentAt: null,
      },
    });
  } catch (error) {
    console.error("Failed to send parent consent confirmation email", error);
  }
}

type ParentConsentLockUserFields = {
  playerAge: number | null;
  parentConsentEmail: string | null;
  parentConsentConfirmedAt: Date | null;
  accountRole: string;
  parentConsentMethod: string | null;
  termsAcceptedAt: Date | null;
};

function userHasUnder13ParentLock(user: ParentConsentLockUserFields, now?: Date) {
  return needsUnder13ParentConfirmationLock({
    playerAge: user.playerAge,
    parentConsentEmail: user.parentConsentEmail,
    parentConsentConfirmedAt: user.parentConsentConfirmedAt,
    accountRole: user.accountRole as "PLAYER" | "PARENT",
    parentConsentMethod: user.parentConsentMethod,
    termsAcceptedAt: user.termsAcceptedAt,
    now,
  });
}

const parentConsentFallbackUserSelect = {
  id: true,
  email: true,
  name: true,
  accountRole: true,
  playerFirstName: true,
  playerLastName: true,
  playerAge: true,
  acceptedByName: true,
  termsAcceptedAt: true,
  parentConsentEmail: true,
  parentConsentConfirmedAt: true,
  parentConsentMethod: true,
  parentConsentEmailSentAt: true,
} as const;

export async function fallbackDeferredParentAccountSignupConsent(
  userId: string,
  reason: ParentSignupDeferralFallbackReason,
): Promise<{ applied: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: parentConsentFallbackUserSelect,
  });

  if (
    !user ||
    !shouldFallbackDeferredParentAccountSignup({
      accountRole: user.accountRole,
      parentConsentMethod: user.parentConsentMethod,
      parentConsentConfirmedAt: user.parentConsentConfirmedAt,
      termsAcceptedAt: user.termsAcceptedAt,
      reason,
    })
  ) {
    return { applied: false };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { parentConsentMethod: null },
  });

  if (!user.parentConsentEmailSentAt && user.parentConsentEmail?.trim()) {
    await maybeSendParentConsentEmail({
      id: user.id,
      name: user.name,
      email: user.email,
      accountRole: user.accountRole,
      playerFirstName: user.playerFirstName,
      playerLastName: user.playerLastName,
      acceptedByName: user.acceptedByName,
      termsAcceptedAt: user.termsAcceptedAt,
      parentConsentEmail: user.parentConsentEmail.trim().toLowerCase(),
      parentConsentEmailSentAt: user.parentConsentEmailSentAt,
    });
  }

  return { applied: true };
}

export async function reconcileDeferredParentAccountSignupConsent(userId: string) {
  await fallbackDeferredParentAccountSignupConsent(userId, "deferral_expired");
}

export async function runDeferredParentAccountSignupFallbacks(
  now = new Date(),
  dryRun = false,
): Promise<{ scanned: number; applied: number }> {
  const cutoff = new Date(now.getTime() - PARENT_ACCOUNT_SIGNUP_CHECKOUT_DEFERRAL_MS);
  const users = await prisma.user.findMany({
    where: {
      accountRole: "PARENT",
      parentConsentMethod: PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
      parentConsentConfirmedAt: null,
      playerAge: { lt: 13 },
      termsAcceptedAt: { lte: cutoff },
    },
    select: { id: true },
  });

  if (dryRun) {
    return { scanned: users.length, applied: 0 };
  }

  let applied = 0;
  for (const user of users) {
    const result = await fallbackDeferredParentAccountSignupConsent(user.id, "deferral_expired");
    if (result.applied) {
      applied += 1;
    }
  }

  return { scanned: users.length, applied };
}

function getParentConsentResendsRemaining(params: {
  parentConsentManualResendDayKey: string | null;
  parentConsentManualResendCount: number;
  now?: Date;
}) {
  const todayKey = getChicagoTodayDateKey(params.now);
  const count =
    params.parentConsentManualResendDayKey === todayKey
      ? params.parentConsentManualResendCount
      : 0;

  return Math.max(0, UNDER13_PARENT_LOCK_MAX_RESENDS_PER_DAY - count);
}

export async function userNeedsUnder13ParentLock(userId: string) {
  await reconcileDeferredParentAccountSignupConsent(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountRole: true,
      playerAge: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
      parentConsentMethod: true,
      termsAcceptedAt: true,
    },
  });

  if (!user) {
    return false;
  }

  return userHasUnder13ParentLock(user);
}

async function notifyPlayerParentConfirmed(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return;
  }

  try {
    await sendPlayerParentConfirmedEmail({
      to: user.email,
      playerName: user.name,
    });
  } catch (error) {
    console.error("Failed to send parent-confirmed email to player", error);
  }

  try {
    await sendPushToUserSafe(
      userId,
      {
        title: "You're all set",
        body: "Let's get to work.",
        url: "/dashboard/today",
      },
      {
        type: "TEST",
        dedupeKey: `${userId}:PARENT_CONFIRMED`,
        skipDedupeCheck: true,
      },
    );
  } catch (error) {
    console.error("Failed to send parent-confirmed push to player", error);
  }
}

export async function getUserLegalStatus(userId: string) {
  await reconcileDeferredParentAccountSignupConsent(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountRole: true,
      playerFirstName: true,
      playerLastName: true,
      name: true,
      termsVersion: true,
      termsAcceptedAt: true,
      acceptedByName: true,
      acceptedAsParent: true,
      playerAge: true,
      parentConsentName: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
      parentConsentMethod: true,
      parentConsentManualResendDayKey: true,
      parentConsentManualResendCount: true,
      mediaConsent: true,
      mediaConsentUpdatedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const matchingWaiver = needsLegalAcceptance({
    termsVersion: user.termsVersion,
    playerAge: user.playerAge,
    acceptedAsParent: user.acceptedAsParent,
  })
    ? await findMatchingWaiverSignatureForUser(userId)
    : null;

  const acceptedViaWaiver = Boolean(matchingWaiver);
  const waiverPlayerAge = matchingWaiver?.playerAge ?? null;

  const effectivePlayerAge = acceptedViaWaiver ? waiverPlayerAge : user.playerAge;
  const effectiveAcceptedAsParent = acceptedViaWaiver
    ? matchingWaiver!.playerAge < 18
    : user.acceptedAsParent;

  const needsUnder13ParentLock = needsUnder13ParentConfirmationLock({
    playerAge: effectivePlayerAge,
    parentConsentEmail: user.parentConsentEmail,
    parentConsentConfirmedAt: user.parentConsentConfirmedAt,
    accountRole: user.accountRole,
    parentConsentMethod: user.parentConsentMethod,
    termsAcceptedAt: user.termsAcceptedAt,
  });

  const playerDisplayName =
    combinePlayerName(user.playerFirstName ?? "", user.playerLastName ?? "") ||
    user.name?.trim() ||
    "your player";

  return {
    currentVersion: LEGAL_DOCS_VERSION,
    needsAcceptance: acceptedViaWaiver
      ? false
      : needsLegalAcceptance({
          termsVersion: user.termsVersion,
          playerAge: user.playerAge,
          acceptedAsParent: user.acceptedAsParent,
        }),
    needsUnder13ParentLock,
    under13ParentConsentGateMode: resolveUnder13ParentConsentGateMode({
      needsUnder13ParentLock,
      accountRole: user.accountRole,
    }),
    playerDisplayName,
    termsVersion: acceptedViaWaiver ? matchingWaiver?.version ?? user.termsVersion : user.termsVersion,
    termsAcceptedAt: acceptedViaWaiver
      ? matchingWaiver?.signedAt.toISOString() ?? user.termsAcceptedAt?.toISOString() ?? null
      : user.termsAcceptedAt?.toISOString() ?? null,
    acceptedByName: acceptedViaWaiver
      ? matchingWaiver?.signerFullName ?? user.acceptedByName
      : user.acceptedByName,
    acceptedAsParent: effectiveAcceptedAsParent,
    playerAge: effectivePlayerAge,
    parentConsentName: user.parentConsentName,
    parentConsentEmail: user.parentConsentEmail,
    parentConsentConfirmedAt: user.parentConsentConfirmedAt?.toISOString() ?? null,
    parentConsentResendsRemaining: needsUnder13ParentLock
      ? getParentConsentResendsRemaining({
          parentConsentManualResendDayKey: user.parentConsentManualResendDayKey,
          parentConsentManualResendCount: user.parentConsentManualResendCount,
        })
      : 0,
    mediaConsent: acceptedViaWaiver ? matchingWaiver!.mediaConsent : user.mediaConsent,
    mediaConsentUpdatedAt: acceptedViaWaiver
      ? matchingWaiver?.signedAt.toISOString() ?? user.mediaConsentUpdatedAt?.toISOString() ?? null
      : user.mediaConsentUpdatedAt?.toISOString() ?? null,
  };
}

export async function saveLegalAcceptance(userId: string, input: LegalAcceptanceInput) {
  const now = new Date();
  const isMinor = isMinorPlayerAge(input.playerAge);

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      parentConsentEmail: true,
      parentConsentEmailSentAt: true,
    },
  });

  if (!existing) {
    throw new Error("User not found.");
  }

  const parentConsentEmail = isMinor ? input.parentConsentEmail?.trim().toLowerCase() ?? null : null;
  const parentConsentName = isMinor ? input.parentConsentName?.trim() ?? null : null;
  const shouldResetParentConfirmation =
    isMinor &&
    (parentConsentEmail !== existing.parentConsentEmail?.trim().toLowerCase() ||
      !existing.parentConsentEmailSentAt);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      termsVersion: LEGAL_DOCS_VERSION,
      termsAcceptedAt: now,
      acceptedByName: input.acceptedByName.trim(),
      acceptedAsParent: input.acceptedAsParent,
      playerAge: input.playerAge,
      parentConsentName,
      parentConsentEmail,
      parentConsentConfirmedAt: isMinor
        ? shouldResetParentConfirmation
          ? null
          : undefined
        : null,
      parentConsentEmailSentAt: isMinor ? undefined : null,
      parentConsentReminderSentAt: isMinor
        ? shouldResetParentConfirmation
          ? null
          : undefined
        : null,
      mediaConsent: input.mediaConsent,
      mediaConsentUpdatedAt: now,
    },
    select: {
      id: true,
      email: true,
      name: true,
      accountRole: true,
      playerFirstName: true,
      playerLastName: true,
      termsVersion: true,
      termsAcceptedAt: true,
      acceptedByName: true,
      acceptedAsParent: true,
      playerAge: true,
      parentConsentName: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
      parentConsentEmailSentAt: true,
      mediaConsent: true,
      mediaConsentUpdatedAt: true,
    },
  });

  if (isMinor && parentConsentName && parentConsentEmail) {
    await applySecondEmailFromParentConsent(userId, {
      parentConsentName,
      parentConsentEmail,
    });

    if (shouldResetParentConfirmation || !updated.parentConsentEmailSentAt) {
      await maybeSendParentConsentEmail(updated);
    }
  }

  return updated;
}

export async function confirmParentConsent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountRole: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
      playerAge: true,
    },
  });

  if (!user?.parentConsentEmail || !isMinorPlayerAge(user.playerAge)) {
    return { ok: false as const, error: "No pending parent confirmation." };
  }

  if (user.parentConsentConfirmedAt) {
    return { ok: true as const, alreadyConfirmed: true };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      parentConsentConfirmedAt: new Date(),
      parentConsentMethod: PARENT_CONSENT_METHOD_EMAIL_CONFIRM,
    },
  });

  if (isUnder13PlayerAge(user.playerAge) && user.accountRole !== "PARENT") {
    await notifyPlayerParentConfirmed(userId);
  }

  return { ok: true as const, alreadyConfirmed: false };
}

export async function confirmParentConsentFromPayment(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountRole: true,
      playerAge: true,
      parentConsentConfirmedAt: true,
      parentConsentEmail: true,
    },
  });

  if (
    !user ||
    user.accountRole !== "PARENT" ||
    !isUnder13PlayerAge(user.playerAge) ||
    !user.parentConsentEmail?.trim()
  ) {
    return;
  }

  if (user.parentConsentConfirmedAt) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      parentConsentConfirmedAt: new Date(),
      parentConsentMethod: PARENT_CONSENT_METHOD_PAYMENT,
    },
  });
}

export async function resendParentConsentEmailForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      accountRole: true,
      playerFirstName: true,
      playerLastName: true,
      playerAge: true,
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
      parentConsentMethod: true,
      parentConsentManualResendDayKey: true,
      parentConsentManualResendCount: true,
    },
  });

  if (!user || !userHasUnder13ParentLock({ ...user, termsAcceptedAt: user.termsAcceptedAt ?? null })) {
    return { ok: false as const, error: "No pending parent confirmation." };
  }

  const todayKey = getChicagoTodayDateKey();
  const currentCount =
    user.parentConsentManualResendDayKey === todayKey
      ? user.parentConsentManualResendCount
      : 0;

  if (currentCount >= UNDER13_PARENT_LOCK_MAX_RESENDS_PER_DAY) {
    return {
      ok: false as const,
      error: "You can resend up to 3 times per day. Try again tomorrow.",
      resendsRemaining: 0,
    };
  }

  if (!user.parentConsentEmail?.trim() || !user.termsAcceptedAt || !user.acceptedByName) {
    return { ok: false as const, error: "Unable to resend parent confirmation email." };
  }

  try {
    await sendParentConsentConfirmEmail({
      to: user.parentConsentEmail.trim(),
      userId: user.id,
      playerName:
        combinePlayerName(user.playerFirstName ?? "", user.playerLastName ?? "") || user.name,
      playerEmail: user.email,
      agreedByName: user.acceptedByName,
      agreedAt: user.termsAcceptedAt,
      audience: user.accountRole === "PARENT" ? "parent_account_holder" : "third_party_parent",
    });
  } catch (error) {
    console.error("Failed to resend parent consent confirmation email", error);
    return { ok: false as const, error: "Unable to send email right now. Try again soon." };
  }

  const nextCount = currentCount + 1;
  await prisma.user.update({
    where: { id: userId },
    data: {
      parentConsentManualResendDayKey: todayKey,
      parentConsentManualResendCount: nextCount,
      parentConsentEmailSentAt: new Date(),
      parentConsentReminderSentAt: null,
    },
  });

  return {
    ok: true as const,
    resendsRemaining: Math.max(0, UNDER13_PARENT_LOCK_MAX_RESENDS_PER_DAY - nextCount),
  };
}

export async function updateParentConsentEmailForUser(userId: string, nextEmail: string) {
  const emailError = validateParentConsentEmail(nextEmail);
  if (emailError) {
    return { ok: false as const, error: emailError };
  }

  const normalizedEmail = nextEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      accountRole: true,
      playerFirstName: true,
      playerLastName: true,
      playerAge: true,
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
      parentConsentMethod: true,
    },
  });

  if (!user || !userHasUnder13ParentLock(user)) {
    return { ok: false as const, error: "No pending parent confirmation." };
  }

  if (!user.termsAcceptedAt || !user.acceptedByName) {
    return { ok: false as const, error: "Unable to update parent email." };
  }

  const todayKey = getChicagoTodayDateKey();
  await prisma.user.update({
    where: { id: userId },
    data: {
      parentConsentEmail: normalizedEmail,
      parentConsentConfirmedAt: null,
      parentConsentEmailSentAt: null,
      parentConsentReminderSentAt: null,
      parentConsentManualResendDayKey: todayKey,
      parentConsentManualResendCount: 0,
    },
  });

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId },
    select: { id: true, parentEmail: true },
  });

  if (enrollment && !enrollment.parentEmail?.trim()) {
    await prisma.programEnrollment.update({
      where: { id: enrollment.id },
      data: {
        parentEmail: normalizedEmail,
        parentEmailsEnabled: true,
      },
    });
  }

  try {
    await sendParentConsentConfirmEmail({
      to: normalizedEmail,
      userId: user.id,
      playerName:
        combinePlayerName(user.playerFirstName ?? "", user.playerLastName ?? "") || user.name,
      playerEmail: user.email,
      agreedByName: user.acceptedByName,
      agreedAt: user.termsAcceptedAt,
      audience: user.accountRole === "PARENT" ? "parent_account_holder" : "third_party_parent",
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        parentConsentEmailSentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to send parent consent email after email update", error);
    return {
      ok: false as const,
      error: "Email updated, but we couldn't send the confirmation email. Try resend.",
      parentConsentEmail: normalizedEmail,
    };
  }

  return {
    ok: true as const,
    parentConsentEmail: normalizedEmail,
    resendsRemaining: UNDER13_PARENT_LOCK_MAX_RESENDS_PER_DAY,
  };
}

export async function updateUserMediaConsent(userId: string, mediaConsent: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      mediaConsent,
      mediaConsentUpdatedAt: new Date(),
    },
    select: {
      mediaConsent: true,
      mediaConsentUpdatedAt: true,
      mediaOptOutAll: true,
    },
  });
}

export async function updateUserMediaOptOutAll(userId: string, mediaOptOutAll: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { mediaOptOutAll },
    select: {
      mediaConsent: true,
      mediaOptOutAll: true,
      mediaConsentUpdatedAt: true,
    },
  });
}

export async function updateWaiverMediaOptOutAll(
  waiverSignatureId: string,
  mediaOptOutAll: boolean,
) {
  return prisma.waiverSignature.update({
    where: { id: waiverSignatureId },
    data: { mediaOptOutAll },
    select: {
      id: true,
      mediaConsent: true,
      mediaOptOutAll: true,
    },
  });
}

export async function userHasCurrentTermsAcceptance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      termsVersion: true,
      playerAge: true,
      acceptedAsParent: true,
    },
  });

  if (!user) {
    return false;
  }

  if (
    !needsLegalAcceptance({
      termsVersion: user.termsVersion,
      playerAge: user.playerAge,
      acceptedAsParent: user.acceptedAsParent,
    })
  ) {
    return true;
  }

  const matchingWaiver = await findMatchingWaiverSignatureForUser(userId);
  return Boolean(matchingWaiver);
}

export async function loadUnconfirmedMinorParentSummaries(now = new Date()) {
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - threeDaysMs);

  const users = await prisma.user.findMany({
    where: {
      playerAge: { lt: 18 },
      acceptedAsParent: true,
      parentConsentEmail: { not: null },
      parentConsentConfirmedAt: null,
      termsAcceptedAt: { lte: cutoff },
    },
    select: {
      name: true,
      email: true,
    },
    orderBy: { termsAcceptedAt: "asc" },
  });

  return users.map((user) => user.name?.trim() || user.email);
}

export async function applyMinorLegalParentConsentRecords(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      playerAge: true,
      parentConsentName: true,
      parentConsentEmail: true,
    },
  });

  if (
    !user ||
    !isMinorPlayerAge(user.playerAge) ||
    !user.parentConsentName?.trim() ||
    !user.parentConsentEmail?.trim()
  ) {
    return;
  }

  await applySecondEmailFromParentConsent(userId, {
    parentConsentName: user.parentConsentName.trim(),
    parentConsentEmail: user.parentConsentEmail.trim().toLowerCase(),
  });
}

export async function sendMinorLegalParentConsentEmailIfNeeded(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      accountRole: true,
      playerFirstName: true,
      playerLastName: true,
      playerAge: true,
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentEmail: true,
      parentConsentEmailSentAt: true,
      parentConsentMethod: true,
    },
  });

  if (
    !user ||
    !isMinorPlayerAge(user.playerAge) ||
    !user.parentConsentEmail?.trim() ||
    user.parentConsentEmailSentAt ||
    user.parentConsentMethod === PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP
  ) {
    return;
  }

  await maybeSendParentConsentEmail({
    ...user,
    parentConsentEmail: user.parentConsentEmail.trim().toLowerCase(),
  });
}

export async function finalizeMinorLegalAcceptanceSideEffects(userId: string) {
  await applyMinorLegalParentConsentRecords(userId);
  await sendMinorLegalParentConsentEmailIfNeeded(userId);
}

export type ParentConsentReminderPreview = {
  channel: "parent-consent-reminder";
  userId: string;
  to: string;
  subject: string;
};

/** Same eligibility as sendDueParentConsentReminders; for cron dry run previews only. */
export async function loadParentConsentReminderPreviews(now = new Date()) {
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - twoDaysMs);

  const users = await prisma.user.findMany({
    where: {
      playerAge: { lt: 18 },
      acceptedAsParent: true,
      parentConsentEmail: { not: null },
      parentConsentConfirmedAt: null,
      parentConsentEmailSentAt: { lte: cutoff },
      parentConsentReminderSentAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      accountRole: true,
      playerFirstName: true,
      playerLastName: true,
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentEmail: true,
      parentConsentMethod: true,
    },
  });

  const { buildParentConsentConfirmEmail } = await import("@/lib/parent-consent-email-shared");

  const previews: ParentConsentReminderPreview[] = [];

  for (const user of users) {
    if (
      !user.parentConsentEmail?.trim() ||
      !user.termsAcceptedAt ||
      !user.acceptedByName ||
      user.parentConsentMethod === PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP
    ) {
      continue;
    }

    const playerName =
      combinePlayerName(user.playerFirstName ?? "", user.playerLastName ?? "") || user.name;
    const email = buildParentConsentConfirmEmail({
      userId: user.id,
      playerName,
      playerEmail: user.email,
      agreedByName: user.acceptedByName,
      agreedAt: user.termsAcceptedAt,
      isReminder: true,
      audience: user.accountRole === "PARENT" ? "parent_account_holder" : "third_party_parent",
    });

    previews.push({
      channel: "parent-consent-reminder",
      userId: user.id,
      to: user.parentConsentEmail.trim(),
      subject: email.subject,
    });
  }

  return previews;
}

export async function sendDueParentConsentReminders(now = new Date()) {
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - twoDaysMs);

  const users = await prisma.user.findMany({
    where: {
      playerAge: { lt: 18 },
      acceptedAsParent: true,
      parentConsentEmail: { not: null },
      parentConsentConfirmedAt: null,
      parentConsentEmailSentAt: { lte: cutoff },
      parentConsentReminderSentAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      accountRole: true,
      playerFirstName: true,
      playerLastName: true,
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentEmail: true,
      parentConsentMethod: true,
    },
  });

  let sent = 0;

  for (const user of users) {
    if (
      !user.parentConsentEmail?.trim() ||
      !user.termsAcceptedAt ||
      !user.acceptedByName ||
      user.parentConsentMethod === PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP
    ) {
      continue;
    }

    try {
      await sendParentConsentConfirmEmail({
        to: user.parentConsentEmail.trim(),
        userId: user.id,
        playerName:
          combinePlayerName(user.playerFirstName ?? "", user.playerLastName ?? "") || user.name,
        playerEmail: user.email,
        agreedByName: user.acceptedByName,
        agreedAt: user.termsAcceptedAt,
        isReminder: true,
        audience: user.accountRole === "PARENT" ? "parent_account_holder" : "third_party_parent",
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          parentConsentReminderSentAt: now,
        },
      });

      sent += 1;
    } catch (error) {
      console.error(`Failed to send parent consent reminder for user ${user.id}`, error);
    }
  }

  return sent;
}
