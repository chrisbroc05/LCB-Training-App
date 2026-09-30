import "server-only";

import { prisma } from "@/lib/prisma";
import { LEGAL_DOCS_VERSION, needsLegalAcceptance } from "@/lib/legal-shared";
import { findMatchingWaiverSignatureForUser } from "@/lib/waiver-sign-server";

export type LegalAcceptanceInput = {
  acceptedByName: string;
  acceptedAsParent: boolean;
  mediaConsent: boolean;
};

export async function getUserLegalStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      termsVersion: true,
      termsAcceptedAt: true,
      acceptedByName: true,
      acceptedAsParent: true,
      mediaConsent: true,
      mediaConsentUpdatedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const matchingWaiver = needsLegalAcceptance(user.termsVersion)
    ? await findMatchingWaiverSignatureForUser(userId)
    : null;

  const acceptedViaWaiver = Boolean(matchingWaiver);

  return {
    currentVersion: LEGAL_DOCS_VERSION,
    needsAcceptance: acceptedViaWaiver ? false : needsLegalAcceptance(user.termsVersion),
    termsVersion: acceptedViaWaiver ? matchingWaiver?.version ?? user.termsVersion : user.termsVersion,
    termsAcceptedAt: acceptedViaWaiver
      ? matchingWaiver?.signedAt.toISOString() ?? user.termsAcceptedAt?.toISOString() ?? null
      : user.termsAcceptedAt?.toISOString() ?? null,
    acceptedByName: acceptedViaWaiver
      ? matchingWaiver?.signerFullName ?? user.acceptedByName
      : user.acceptedByName,
    acceptedAsParent: acceptedViaWaiver
      ? matchingWaiver!.playerAge < 18
      : user.acceptedAsParent,
    mediaConsent: acceptedViaWaiver ? matchingWaiver!.mediaConsent : user.mediaConsent,
    mediaConsentUpdatedAt: acceptedViaWaiver
      ? matchingWaiver?.signedAt.toISOString() ?? user.mediaConsentUpdatedAt?.toISOString() ?? null
      : user.mediaConsentUpdatedAt?.toISOString() ?? null,
  };
}

export async function saveLegalAcceptance(userId: string, input: LegalAcceptanceInput) {
  const now = new Date();

  return prisma.user.update({
    where: { id: userId },
    data: {
      termsVersion: LEGAL_DOCS_VERSION,
      termsAcceptedAt: now,
      acceptedByName: input.acceptedByName.trim(),
      acceptedAsParent: input.acceptedAsParent,
      mediaConsent: input.mediaConsent,
      mediaConsentUpdatedAt: now,
    },
    select: {
      termsVersion: true,
      termsAcceptedAt: true,
      acceptedByName: true,
      acceptedAsParent: true,
      mediaConsent: true,
      mediaConsentUpdatedAt: true,
    },
  });
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
    select: { termsVersion: true },
  });

  if (!user) {
    return false;
  }

  if (!needsLegalAcceptance(user.termsVersion)) {
    return true;
  }

  const matchingWaiver = await findMatchingWaiverSignatureForUser(userId);
  return Boolean(matchingWaiver);
}
