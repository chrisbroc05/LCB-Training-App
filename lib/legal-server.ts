import "server-only";

import { prisma } from "@/lib/prisma";
import {
  isMinorPlayerAge,
  LEGAL_DOCS_VERSION,
  needsLegalAcceptance,
} from "@/lib/legal-shared";
import { sendParentConsentConfirmEmail } from "@/lib/parent-consent-email";
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

  return {
    currentVersion: LEGAL_DOCS_VERSION,
    needsAcceptance: acceptedViaWaiver
      ? false
      : needsLegalAcceptance({
          termsVersion: user.termsVersion,
          playerAge: user.playerAge,
          acceptedAsParent: user.acceptedAsParent,
        }),
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

  return { ok: true as const, alreadyConfirmed: false };
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
