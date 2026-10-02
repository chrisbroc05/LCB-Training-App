import "server-only";

import type { WaiverSignupType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatLegalAgreementRole, formatParentConsentStatus } from "@/lib/legal-shared";
import {
  buildAgreementMergeKey,
  formatAgreementSourceLabels,
  isAgreementOutdatedVersion,
  type AgreementSource,
  type AgreementSourceFilter,
  type UnifiedAgreementRecord,
} from "@/lib/admin-agreements-shared";
import {
  buildWaiverPlayerFullName,
  normalizeTeamSlug,
} from "@/lib/waiver-sign-shared";

export type UnifiedAgreementListFilters = {
  teamSlug?: string;
  search?: string;
  source?: AgreementSourceFilter;
};

type WaiverRow = {
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
  userId: string | null;
};

type AppRow = {
  id: string;
  name: string | null;
  email: string;
  membershipTier: string;
  termsVersion: string | null;
  termsAcceptedAt: Date;
  acceptedByName: string | null;
  acceptedAsParent: boolean;
  playerAge: number | null;
  parentConsentEmail: string | null;
  parentConsentConfirmedAt: Date | null;
  mediaConsent: boolean;
  trainsInPerson: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalNotes: string | null;
};

type AgreementPartial = {
  mergeKey: string;
  playerName: string;
  email: string;
  sources: AgreementSource[];
  waiverSignatureId: string | null;
  userId: string | null;
  accountName: string | null;
  playerAge: number | null;
  teamName: string | null;
  teamSlug: string | null;
  signupType: string | null;
  signerFullName: string | null;
  signerEmail: string | null;
  signerPhone: string | null;
  typedSignature: string | null;
  ip: string | null;
  isTwelveWeekPlayer: boolean;
  version: string;
  signedAt: Date;
  mediaConsent: boolean;
  acceptedByName: string | null;
  acceptedAsParent: boolean | null;
  agreementRoleLabel: string | null;
  trainsInPerson: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalNotes: string | null;
  isOutdatedVersion: boolean;
  parentConsentStatus: string | null;
};

function waiverToPartial(row: WaiverRow): AgreementPartial {
  const playerName = buildWaiverPlayerFullName(row.playerFirstName, row.playerLastName);
  return {
    mergeKey: buildAgreementMergeKey(row.signerEmail, playerName),
    playerName,
    email: row.signerEmail.toLowerCase(),
    sources: ["waiver_link"],
    waiverSignatureId: row.id,
    userId: row.userId,
    accountName: null as string | null,
    playerAge: row.playerAge,
    teamName: row.teamName,
    teamSlug: row.teamSlug,
    signupType: row.signupType,
    signerFullName: row.signerFullName,
    signerEmail: row.signerEmail,
    signerPhone: row.signerPhone,
    typedSignature: row.typedSignature,
    ip: row.ip,
    isTwelveWeekPlayer: false,
    version: row.version,
    signedAt: row.signedAt,
    mediaConsent: row.mediaConsent,
    acceptedByName: row.signerFullName,
    acceptedAsParent: row.playerAge < 18,
    agreementRoleLabel: formatLegalAgreementRole(row.playerAge < 18),
    trainsInPerson: false,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
    medicalNotes: row.medicalNotes,
    isOutdatedVersion: isAgreementOutdatedVersion(row.version),
    parentConsentStatus: null,
  };
}

function appToPartial(row: AppRow): AgreementPartial {
  const playerName = row.name?.trim() || row.email;
  return {
    mergeKey: buildAgreementMergeKey(row.email, playerName),
    playerName,
    email: row.email.toLowerCase(),
    sources: ["app_signup"],
    waiverSignatureId: null as string | null,
    userId: row.id,
    accountName: row.name,
    playerAge: row.playerAge,
    teamName: null as string | null,
    teamSlug: null as string | null,
    signupType: null as string | null,
    signerFullName: null as string | null,
    signerEmail: row.email,
    signerPhone: null as string | null,
    typedSignature: null as string | null,
    ip: null as string | null,
    isTwelveWeekPlayer: row.membershipTier === "TWELVE_WEEK",
    version: row.termsVersion ?? "",
    signedAt: row.termsAcceptedAt,
    mediaConsent: row.mediaConsent,
    acceptedByName: row.acceptedByName,
    acceptedAsParent: row.acceptedAsParent,
    agreementRoleLabel: row.acceptedByName
      ? formatLegalAgreementRole(row.acceptedAsParent)
      : null,
    trainsInPerson: row.trainsInPerson,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
    medicalNotes: row.medicalNotes,
    isOutdatedVersion: isAgreementOutdatedVersion(row.termsVersion),
    parentConsentStatus: formatParentConsentStatus({
      playerAge: row.playerAge,
      parentConsentEmail: row.parentConsentEmail,
      parentConsentConfirmedAt: row.parentConsentConfirmedAt,
      termsAcceptedAt: row.termsAcceptedAt,
    }),
  };
}

function mergePartials(left: AgreementPartial, right: AgreementPartial): AgreementPartial {
  const sources = Array.from(new Set([...left.sources, ...right.sources])) as Array<
    "waiver_link" | "app_signup"
  >;
  const signedAt = left.signedAt > right.signedAt ? left.signedAt : right.signedAt;
  const useRightAsPrimary = right.signedAt >= left.signedAt;
  const primary = useRightAsPrimary ? right : left;
  const secondary = useRightAsPrimary ? left : right;

  return {
    mergeKey: left.mergeKey,
    playerName: primary.playerName || secondary.playerName,
    email: primary.email || secondary.email,
    sources,
    waiverSignatureId: left.waiverSignatureId ?? right.waiverSignatureId,
    userId: left.userId ?? right.userId,
    accountName: ("accountName" in right ? right.accountName : null) ?? left.accountName,
    playerAge: left.playerAge ?? right.playerAge,
    teamName: left.teamName ?? right.teamName,
    teamSlug: left.teamSlug ?? right.teamSlug,
    signupType: left.signupType ?? right.signupType,
    signerFullName: left.signerFullName ?? right.signerFullName,
    signerEmail: left.signerEmail ?? right.signerEmail,
    signerPhone: left.signerPhone ?? right.signerPhone,
    typedSignature: left.typedSignature ?? right.typedSignature,
    ip: left.ip ?? right.ip,
    isTwelveWeekPlayer: left.isTwelveWeekPlayer || right.isTwelveWeekPlayer,
    version: primary.version || secondary.version,
    signedAt,
    mediaConsent: primary.mediaConsent,
    acceptedByName: primary.acceptedByName ?? secondary.acceptedByName,
    acceptedAsParent: primary.acceptedAsParent ?? secondary.acceptedAsParent,
    agreementRoleLabel: primary.agreementRoleLabel ?? secondary.agreementRoleLabel,
    trainsInPerson: left.trainsInPerson || right.trainsInPerson,
    emergencyContactName:
      (right.trainsInPerson ? right.emergencyContactName : null)?.trim() ||
      (left.trainsInPerson ? left.emergencyContactName : null)?.trim() ||
      right.emergencyContactName?.trim() ||
      left.emergencyContactName?.trim() ||
      null,
    emergencyContactPhone:
      (right.trainsInPerson ? right.emergencyContactPhone : null)?.trim() ||
      (left.trainsInPerson ? left.emergencyContactPhone : null)?.trim() ||
      right.emergencyContactPhone?.trim() ||
      left.emergencyContactPhone?.trim() ||
      null,
    medicalNotes:
      (right.trainsInPerson ? right.medicalNotes : null)?.trim() ||
      (left.trainsInPerson ? left.medicalNotes : null)?.trim() ||
      right.medicalNotes?.trim() ||
      left.medicalNotes?.trim() ||
      null,
    isOutdatedVersion: left.isOutdatedVersion || right.isOutdatedVersion,
    parentConsentStatus: primary.parentConsentStatus ?? secondary.parentConsentStatus,
  };
}

function serializeMerged(record: AgreementPartial): UnifiedAgreementRecord {
  return {
    id: record.mergeKey,
    playerName: record.playerName,
    email: record.email,
    sources: record.sources,
    sourceLabels: formatAgreementSourceLabels(record.sources),
    waiverSignatureId: record.waiverSignatureId,
    userId: record.userId,
    accountName: record.accountName,
    playerAge: record.playerAge,
    teamName: record.teamName,
    teamSlug: record.teamSlug,
    signupType: record.signupType,
    signerFullName: record.signerFullName,
    signerEmail: record.signerEmail,
    signerPhone: record.signerPhone,
    typedSignature: record.typedSignature,
    ip: record.ip,
    isTwelveWeekPlayer: record.isTwelveWeekPlayer,
    version: record.version,
    signedAt: record.signedAt.toISOString(),
    mediaConsent: record.mediaConsent,
    acceptedByName: record.acceptedByName,
    acceptedAsParent: record.acceptedAsParent,
    agreementRoleLabel: record.agreementRoleLabel,
    trainsInPerson: record.trainsInPerson,
    emergencyContactName: record.emergencyContactName,
    emergencyContactPhone: record.emergencyContactPhone,
    medicalNotes: record.medicalNotes,
    isOutdatedVersion: record.isOutdatedVersion,
    parentConsentStatus: record.parentConsentStatus,
  };
}

function recordMatchesSearch(record: UnifiedAgreementRecord, search: string) {
  const haystack = [
    record.playerName,
    record.email,
    record.accountName ?? "",
    record.signerFullName ?? "",
    record.signerEmail ?? "",
    record.teamName ?? "",
    record.acceptedByName ?? "",
    record.emergencyContactName ?? "",
    record.medicalNotes ?? "",
    record.sourceLabels.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
}

export async function listUnifiedAgreements(filters: UnifiedAgreementListFilters = {}) {
  const search = filters.search?.trim();
  const teamSlug = filters.teamSlug;
  const sourceFilter = filters.source ?? "all";

  const waiverWhere = {
    ...(teamSlug ? { teamSlug } : {}),
  };

  const [waivers, appUsers] = await Promise.all([
    prisma.waiverSignature.findMany({
      where: waiverWhere,
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
        userId: true,
      },
    }),
    prisma.user.findMany({
      where: {
        termsAcceptedAt: { not: null },
      },
      orderBy: { termsAcceptedAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        membershipTier: true,
        termsVersion: true,
        termsAcceptedAt: true,
        acceptedByName: true,
        acceptedAsParent: true,
        playerAge: true,
        parentConsentEmail: true,
        parentConsentConfirmedAt: true,
        mediaConsent: true,
        trainsInPerson: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        medicalNotes: true,
      },
    }),
  ]);

  const mergedMap = new Map<string, AgreementPartial>();

  for (const waiver of waivers) {
    const partial = waiverToPartial(waiver);
    const existing = mergedMap.get(partial.mergeKey);
    if (existing) {
      mergedMap.set(partial.mergeKey, mergePartials(existing, partial));
    } else {
      mergedMap.set(partial.mergeKey, partial);
    }
  }

  for (const appUser of appUsers) {
    if (!appUser.termsAcceptedAt) {
      continue;
    }

    const partial = appToPartial({
      ...appUser,
      termsAcceptedAt: appUser.termsAcceptedAt,
    });
    const existing = mergedMap.get(partial.mergeKey);
    if (existing) {
      mergedMap.set(partial.mergeKey, mergePartials(existing, partial));
    } else {
      mergedMap.set(partial.mergeKey, partial);
    }
  }

  let records = Array.from(mergedMap.values())
    .map(serializeMerged)
    .sort((left, right) => right.signedAt.localeCompare(left.signedAt));

  if (teamSlug) {
    records = records.filter((record) => record.teamSlug === teamSlug);
  }

  if (sourceFilter !== "all") {
    records = records.filter((record) => {
      if (sourceFilter === "waiver_link") {
        return record.sources.includes("waiver_link");
      }
      if (sourceFilter === "app_signup") {
        return record.sources.includes("app_signup");
      }
      if (sourceFilter === "twelve_week") {
        return record.isTwelveWeekPlayer;
      }
      if (sourceFilter === "in_person") {
        return record.trainsInPerson;
      }
      return true;
    });
  }

  if (search) {
    records = records.filter((record) => recordMatchesSearch(record, search));
  }

  return records;
}

export function buildUnifiedAgreementsCsv(records: UnifiedAgreementRecord[]) {
  const headers = [
    "Player Name",
    "Email",
    "Source",
    "In Person",
    "Age",
    "Team",
    "Signup Type",
    "12-Week Player",
    "Agreed By",
    "Agreement Role",
    "Signer Email",
    "Signer Phone",
    "Emergency Contact",
    "Emergency Phone",
    "Medical Notes",
    "Media Consent",
    "Version",
    "Signed At",
    "Outdated Version",
  ];

  const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;

  const rows = records.map((record) =>
    [
      record.playerName,
      record.email,
      record.sourceLabels.join(" + "),
      record.trainsInPerson ? "Yes" : "No",
      record.playerAge != null ? String(record.playerAge) : "",
      record.teamName ?? "",
      record.signupType ?? "",
      record.isTwelveWeekPlayer ? "Yes" : "No",
      record.acceptedByName ?? "",
      record.agreementRoleLabel ?? "",
      record.signerEmail ?? record.email,
      record.signerPhone ?? "",
      record.emergencyContactName ?? "",
      record.emergencyContactPhone ?? "",
      record.medicalNotes ?? "",
      record.mediaConsent ? "Yes" : "No",
      record.version,
      record.signedAt,
      record.isOutdatedVersion ? "Yes" : "No",
    ]
      .map((value) => escapeCsv(value))
      .join(","),
  );

  return [headers.map((value) => escapeCsv(value)).join(","), ...rows].join("\n");
}

export function resolveTeamSlugFilter(team: string) {
  return team ? normalizeTeamSlug(team) : undefined;
}
