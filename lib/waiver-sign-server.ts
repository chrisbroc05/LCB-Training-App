import "server-only";

import type { WaiverSignupType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LEGAL_DOCS_VERSION } from "@/lib/legal-shared";
import {
  buildWaiverPlayerFullName,
  normalizePersonName,
  WAIVER_SIGN_RATE_LIMIT_PER_HOUR,
  waiverPlayerNameMatches,
  type WaiverSignPlayerInput,
  type WaiverSignSharedInput,
} from "@/lib/waiver-sign-shared";

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export async function isWaiverSignRateLimited(ip: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentSignatures = await prisma.waiverSignature.findMany({
    where: {
      ip,
      signedAt: { gte: since },
    },
    select: {
      id: true,
      submissionBatchId: true,
    },
  });

  const submissionCount = new Set(
    recentSignatures.map((signature) => signature.submissionBatchId ?? signature.id),
  ).size;

  return submissionCount >= WAIVER_SIGN_RATE_LIMIT_PER_HOUR;
}

export async function findLinkedUserIdForWaiverEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function createWaiverSignatureBatch(params: {
  shared: WaiverSignSharedInput;
  players: WaiverSignPlayerInput[];
  ip: string;
  submissionBatchId: string;
  signedAt?: Date;
}) {
  const userId = await findLinkedUserIdForWaiverEmail(params.shared.signerEmail);
  const signedAt = params.signedAt ?? new Date();

  return prisma.$transaction(
    params.players.map((player) =>
      prisma.waiverSignature.create({
        data: {
          playerFirstName: player.playerFirstName,
          playerLastName: player.playerLastName,
          playerAge: player.playerAge,
          medicalNotes: player.medicalNotes,
          teamName: params.shared.teamName,
          teamSlug: params.shared.teamSlug,
          signupType: params.shared.signupType,
          signerFullName: params.shared.signerFullName,
          signerEmail: params.shared.signerEmail,
          signerPhone: params.shared.signerPhone,
          emergencyContactName: params.shared.emergencyContactName,
          emergencyContactPhone: params.shared.emergencyContactPhone,
          mediaConsent: params.shared.mediaConsent,
          typedSignature: params.shared.typedSignature,
          version: params.shared.version,
          ip: params.ip,
          submissionBatchId: params.submissionBatchId,
          signedAt,
          userId,
        },
      }),
    ),
  );
}

export async function findMatchingWaiverSignatureForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
    },
  });

  if (!user) {
    return null;
  }

  const signatures = await prisma.waiverSignature.findMany({
    where: {
      version: LEGAL_DOCS_VERSION,
      OR: [{ userId }, { signerEmail: user.email }],
    },
    orderBy: { signedAt: "desc" },
  });

  return (
    signatures.find((signature) =>
      waiverPlayerNameMatches(signature.playerFirstName, signature.playerLastName, user.name),
    ) ?? null
  );
}

export async function linkWaiverSignaturesToUser(userId: string, email: string) {
  await prisma.waiverSignature.updateMany({
    where: {
      signerEmail: email.toLowerCase(),
      userId: null,
    },
    data: { userId },
  });
}

export async function applyMatchingWaiverAcceptanceToUser(userId: string) {
  const signature = await findMatchingWaiverSignatureForUser(userId);
  if (!signature) {
    return null;
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      termsVersion: signature.version,
      termsAcceptedAt: signature.signedAt,
      acceptedByName: signature.signerFullName,
      acceptedAsParent: signature.playerAge < 18,
      mediaConsent: signature.mediaConsent,
      mediaConsentUpdatedAt: signature.signedAt,
    },
    select: {
      termsVersion: true,
      termsAcceptedAt: true,
      acceptedByName: true,
      acceptedAsParent: true,
      mediaConsent: true,
    },
  });
}

export type WaiverSignatureListFilters = {
  teamSlug?: string;
  search?: string;
};

export async function listWaiverSignatures(filters: WaiverSignatureListFilters = {}) {
  const search = filters.search?.trim();
  const where = {
    ...(filters.teamSlug ? { teamSlug: filters.teamSlug } : {}),
    ...(search
      ? {
          OR: [
            { playerFirstName: { contains: search, mode: "insensitive" as const } },
            { playerLastName: { contains: search, mode: "insensitive" as const } },
            { signerFullName: { contains: search, mode: "insensitive" as const } },
            { signerEmail: { contains: search, mode: "insensitive" as const } },
            { teamName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const signatures = await prisma.waiverSignature.findMany({
    where,
    orderBy: { signedAt: "desc" },
    select: {
      id: true,
      playerFirstName: true,
      playerLastName: true,
      playerAge: true,
      teamName: true,
      teamSlug: true,
      signupType: true,
      signerFullName: true,
      signerEmail: true,
      signerPhone: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      medicalNotes: true,
      mediaConsent: true,
      typedSignature: true,
      version: true,
      signedAt: true,
      ip: true,
    },
  });

  return signatures;
}

export async function getWaiverSignatureById(id: string) {
  return prisma.waiverSignature.findUnique({
    where: { id },
  });
}

export function serializeWaiverSignature(signature: {
  id: string;
  playerFirstName: string;
  playerLastName: string;
  playerAge: number;
  teamName: string | null;
  teamSlug: string | null;
  signupType: WaiverSignupType;
  signerFullName: string;
  signerEmail: string;
  signerPhone: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string | null;
  mediaConsent: boolean;
  typedSignature: string;
  version: string;
  signedAt: Date;
  ip: string;
}) {
  return {
    id: signature.id,
    playerName: buildWaiverPlayerFullName(signature.playerFirstName, signature.playerLastName),
    playerFirstName: signature.playerFirstName,
    playerLastName: signature.playerLastName,
    playerAge: signature.playerAge,
    teamName: signature.teamName,
    teamSlug: signature.teamSlug,
    signupType: signature.signupType,
    signerFullName: signature.signerFullName,
    signerEmail: signature.signerEmail,
    signerPhone: signature.signerPhone,
    emergencyContactName: signature.emergencyContactName,
    emergencyContactPhone: signature.emergencyContactPhone,
    medicalNotes: signature.medicalNotes,
    mediaConsent: signature.mediaConsent,
    typedSignature: signature.typedSignature,
    version: signature.version,
    signedAt: signature.signedAt.toISOString(),
    ip: signature.ip,
  };
}

export function buildWaiverCsv(signatures: ReturnType<typeof serializeWaiverSignature>[]) {
  const headers = [
    "Player Name",
    "Age",
    "Team",
    "Signup Type",
    "Signer",
    "Signer Email",
    "Signer Phone",
    "Emergency Contact",
    "Emergency Phone",
    "Medical Notes",
    "Media Consent",
    "Version",
    "Signed At",
  ];

  const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;

  const rows = signatures.map((signature) =>
    [
      signature.playerName,
      String(signature.playerAge),
      signature.teamName ?? "",
      signature.signupType,
      signature.signerFullName,
      signature.signerEmail,
      signature.signerPhone ?? "",
      signature.emergencyContactName,
      signature.emergencyContactPhone,
      signature.medicalNotes ?? "",
      signature.mediaConsent ? "Yes" : "No",
      signature.version,
      signature.signedAt,
    ]
      .map((value) => escapeCsv(value))
      .join(","),
  );

  return [headers.map((value) => escapeCsv(value)).join(","), ...rows].join("\n");
}

export function getSignedPlayerNamesForTeam(
  signatures: Array<{ playerFirstName: string; playerLastName: string }>,
) {
  return signatures.map((signature) =>
    buildWaiverPlayerFullName(signature.playerFirstName, signature.playerLastName),
  );
}

export function normalizeRosterNameForCompare(name: string) {
  return normalizePersonName(name);
}
