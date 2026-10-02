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
  acceptedByName: string | null;
  termsAcceptedAt: Date | null;
  parentConsentEmail: string | null;
  parentConsentEmailSentAt: Date | null;
}) {
  if (!user.parentConsentEmail?.trim() || !user.termsAcceptedAt || !user.acceptedByName) {
    return;
  }

  try {
    await sendParentConsentConfirmEmail({
      to: user.parentConsentEmail.trim(),
      userId: user.id,
      playerName: user.name,
      playerEmail: user.email,
      agreedByName: user.acceptedByName,
      agreedAt: user.termsAcceptedAt,
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      playerAge: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
    },
  });

  if (!user) {
    return false;
  }

  return needsUnder13ParentConfirmationLock({
    playerAge: user.playerAge,
    parentConsentEmail: user.parentConsentEmail,
    parentConsentConfirmedAt: user.parentConsentConfirmedAt,
  });
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      termsVersion: true,
      termsAcceptedAt: true,
      acceptedByName: true,
      acceptedAsParent: true,
      playerAge: true,
      parentConsentName: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
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
  });

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
    },
  });

  if (isUnder13PlayerAge(user.playerAge)) {
    await notifyPlayerParentConfirmed(userId);
  }

  return { ok: true as const, alreadyConfirmed: false };
}

export async function resendParentConsentEmailForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      playerAge: true,
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
      parentConsentManualResendDayKey: true,
      parentConsentManualResendCount: true,
    },
  });

  if (
    !user ||
    !needsUnder13ParentConfirmationLock({
      playerAge: user.playerAge,
      parentConsentEmail: user.parentConsentEmail,
      parentConsentConfirmedAt: user.parentConsentConfirmedAt,
    })
  ) {
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
      playerName: user.name,
      playerEmail: user.email,
      agreedByName: user.acceptedByName,
      agreedAt: user.termsAcceptedAt,
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
      playerAge: true,
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentEmail: true,
      parentConsentConfirmedAt: true,
    },
  });

  if (
    !user ||
    !needsUnder13ParentConfirmationLock({
      playerAge: user.playerAge,
      parentConsentEmail: user.parentConsentEmail,
      parentConsentConfirmedAt: user.parentConsentConfirmedAt,
    })
  ) {
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
      playerName: user.name,
      playerEmail: user.email,
      agreedByName: user.acceptedByName,
      agreedAt: user.termsAcceptedAt,
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

export async function finalizeMinorLegalAcceptanceSideEffects(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      playerAge: true,
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentName: true,
      parentConsentEmail: true,
      parentConsentEmailSentAt: true,
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

  if (!user.parentConsentEmailSentAt) {
    await maybeSendParentConsentEmail({
      ...user,
      parentConsentEmail: user.parentConsentEmail.trim().toLowerCase(),
    });
  }
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
      acceptedByName: true,
      termsAcceptedAt: true,
      parentConsentEmail: true,
    },
  });

  let sent = 0;

  for (const user of users) {
    if (!user.parentConsentEmail?.trim() || !user.termsAcceptedAt || !user.acceptedByName) {
      continue;
    }

    try {
      await sendParentConsentConfirmEmail({
        to: user.parentConsentEmail.trim(),
        userId: user.id,
        playerName: user.name,
        playerEmail: user.email,
        agreedByName: user.acceptedByName,
        agreedAt: user.termsAcceptedAt,
        isReminder: true,
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
