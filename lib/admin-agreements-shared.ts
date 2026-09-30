import { LEGAL_DOCS_VERSION } from "@/lib/legal-shared";
import { normalizePersonName } from "@/lib/waiver-sign-shared";

export type AgreementSource = "waiver_link" | "app_signup";

export type AgreementSourceFilter =
  | "all"
  | "waiver_link"
  | "app_signup"
  | "twelve_week"
  | "in_person";

export const AGREEMENT_SOURCE_FILTER_OPTIONS: Array<{
  value: AgreementSourceFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "waiver_link", label: "Waiver link" },
  { value: "app_signup", label: "App signup" },
  { value: "twelve_week", label: "12-Week players" },
  { value: "in_person", label: "In person" },
];

export type UnifiedAgreementRecord = {
  id: string;
  playerName: string;
  email: string;
  sources: AgreementSource[];
  sourceLabels: string[];
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
  signedAt: string;
  mediaConsent: boolean;
  acceptedByName: string | null;
  acceptedAsParent: boolean | null;
  agreementRoleLabel: string | null;
  trainsInPerson: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalNotes: string | null;
  isOutdatedVersion: boolean;
};

export type RosterPlayerStatus = {
  name: string;
  status: "unsigned" | "signed" | "signed_no_emergency";
};

export function formatAgreementSourceLabels(sources: AgreementSource[]) {
  const labels: string[] = [];
  if (sources.includes("waiver_link")) {
    labels.push("Waiver link");
  }
  if (sources.includes("app_signup")) {
    labels.push("App signup");
  }
  return labels;
}

export function buildAgreementMergeKey(email: string, playerName: string) {
  return `${normalizePersonName(email)}::${normalizePersonName(playerName)}`;
}

export function isAgreementOutdatedVersion(version: string | null | undefined) {
  return Boolean(version && version !== LEGAL_DOCS_VERSION);
}

export function appAgreementMissingInPersonInfo(record: {
  sources: AgreementSource[];
  trainsInPerson: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}) {
  if (!record.sources.includes("app_signup")) {
    return false;
  }

  return (
    !record.trainsInPerson ||
    !record.emergencyContactName?.trim() ||
    !record.emergencyContactPhone?.trim()
  );
}

export function matchesAgreementSourceFilter(
  record: UnifiedAgreementRecord,
  filter: AgreementSourceFilter,
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "waiver_link") {
    return record.sources.includes("waiver_link");
  }

  if (filter === "app_signup") {
    return record.sources.includes("app_signup");
  }

  if (filter === "twelve_week") {
    return record.isTwelveWeekPlayer;
  }

  if (filter === "in_person") {
    return record.trainsInPerson;
  }

  return true;
}

export function findAgreementForRosterName(
  rosterName: string,
  agreements: UnifiedAgreementRecord[],
) {
  const normalized = normalizePersonName(rosterName);
  return agreements.find((record) => normalizePersonName(record.playerName) === normalized) ?? null;
}

export function getRosterPlayerStatus(
  rosterName: string,
  agreements: UnifiedAgreementRecord[],
): RosterPlayerStatus["status"] {
  const match = findAgreementForRosterName(rosterName, agreements);
  if (!match) {
    return "unsigned";
  }

  if (appAgreementMissingInPersonInfo(match)) {
    return "signed_no_emergency";
  }

  return "signed";
}

export function getRosterPlayerStatuses(
  rosterNames: string[],
  agreements: UnifiedAgreementRecord[],
): RosterPlayerStatus[] {
  return rosterNames.map((name) => ({
    name,
    status: getRosterPlayerStatus(name, agreements),
  }));
}

export function formatRosterPlayerStatusLabel(status: RosterPlayerStatus["status"]) {
  if (status === "signed_no_emergency") {
    return "Signed, no emergency contact";
  }

  if (status === "signed") {
    return "Signed";
  }

  return "Not signed";
}
