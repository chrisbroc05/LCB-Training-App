import "server-only";

import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { combinePlayerName } from "@/lib/account-shared";
import {
  CLINIC_LEAD_SOURCE,
  CLINIC_SET_PASSWORD_TTL_MS,
} from "@/lib/clinics-shared";
import { LEGAL_DOCS_VERSION, isUnder13PlayerAge } from "@/lib/legal-shared";
import { PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP } from "@/lib/parent-consent-shared";
import { isTestAccountEmail } from "@/lib/test-account-shared";
import { splitPlayerName } from "@/lib/testing-shared";
import { normalizeLeadEmail } from "@/lib/leads-shared";
import { toPrismaLeadRole } from "@/lib/leads-server";
import { buildLeadMarketingAutoExcludeData } from "@/lib/lead-marketing-server";
import { getPublicAppUrl } from "@/lib/public-app-url";

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function findClinicUserByParentEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return prisma.user.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      email: true,
      playerFirstName: true,
      name: true,
      createdAt: true,
      membershipTier: true,
    },
  });
}

/** Attach registration to existing account without overwriting player profile fields. */
export async function attachClinicRegistrationToExistingUser(params: {
  registrationId: string;
  userId: string;
}) {
  await prisma.clinicRegistration.update({
    where: { id: params.registrationId },
    data: { userId: params.userId },
  });
  return params.userId;
}

export async function createClinicParentAccount(params: {
  parentName: string;
  parentEmail: string;
  playerName: string;
  playerAge: number;
  mediaConsent: boolean;
  acceptedByName: string;
  acceptedAt: Date;
}) {
  const email = params.parentEmail.trim().toLowerCase();
  const { firstName, lastName } = splitPlayerName(params.playerName);
  const playerFirstName = firstName || params.playerName.trim();
  const playerLastName = lastName || "Player";
  const legacyName = combinePlayerName(playerFirstName, playerLastName);
  const passwordHash = await hash(randomBytes(32).toString("hex"), 12);

  const under13 = isUnder13PlayerAge(params.playerAge);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name: legacyName,
      accountRole: "PARENT",
      accountHolderName: params.parentName.trim(),
      playerFirstName,
      playerLastName,
      membershipTier: "FREE",
      signupDate: params.acceptedAt,
      termsVersion: LEGAL_DOCS_VERSION,
      termsAcceptedAt: params.acceptedAt,
      acceptedByName: params.acceptedByName.trim(),
      acceptedAsParent: true,
      playerAge: params.playerAge,
      parentConsentName: params.parentName.trim(),
      parentConsentEmail: email,
      parentConsentConfirmedAt: under13 ? null : params.acceptedAt,
      parentConsentMethod: PARENT_CONSENT_METHOD_ACCOUNT_SIGNUP,
      mediaConsent: params.mediaConsent,
      mediaConsentUpdatedAt: params.acceptedAt,
      isTestAccount: isTestAccountEmail(email),
    },
    select: {
      id: true,
      email: true,
      playerFirstName: true,
      name: true,
    },
  });

  return user;
}

export async function createClinicSetPasswordToken(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + CLINIC_SET_PASSWORD_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const resetUrl = `${getPublicAppUrl()}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
  return { rawToken, resetUrl, expiresAt };
}

export async function upsertClinicMarketingLead(params: {
  parentEmail: string;
  parentName: string;
  userId: string | null;
}) {
  const email = normalizeLeadEmail(params.parentEmail);
  const firstName = params.parentName.trim().split(/\s+/)[0] || "Parent";
  const marketingAutoExclude = buildLeadMarketingAutoExcludeData(email);

  await prisma.lead.upsert({
    where: { email },
    create: {
      email,
      firstName,
      role: toPrismaLeadRole("PARENT"),
      source: CLINIC_LEAD_SOURCE,
      userId: params.userId,
      ...(marketingAutoExclude ?? {}),
    },
    update: {
      firstName,
      role: toPrismaLeadRole("PARENT"),
      source: CLINIC_LEAD_SOURCE,
      userId: params.userId ?? undefined,
      ...(marketingAutoExclude ?? {}),
    },
  });
}
