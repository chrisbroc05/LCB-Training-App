import "server-only";

import { prisma } from "@/lib/prisma";
import { LEGAL_DOCS_VERSION, needsLegalAcceptance } from "@/lib/legal-shared";

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

  return {
    currentVersion: LEGAL_DOCS_VERSION,
    needsAcceptance: needsLegalAcceptance(user.termsVersion),
    termsVersion: user.termsVersion,
    termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
    acceptedByName: user.acceptedByName,
    acceptedAsParent: user.acceptedAsParent,
    mediaConsent: user.mediaConsent,
    mediaConsentUpdatedAt: user.mediaConsentUpdatedAt?.toISOString() ?? null,
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

  return !needsLegalAcceptance(user.termsVersion);
}
