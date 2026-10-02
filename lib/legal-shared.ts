import { isValidEmailFormat } from "@/lib/second-email-shared";

export const LEGAL_DOCS_VERSION = "2026-09-29";

export const LEGAL_ADULT_AGE = 18;

export const LEGAL_MIN_PLAYER_AGE = 5;

export const LEGAL_MAX_PLAYER_AGE = 25;

export type LegalDocumentId = "terms" | "privacy" | "waiver";

export type LegalAgreementRole = "player" | "parent";

export type LegalDocBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "heading"; text: string };

export type LegalDocumentConfig = {
  id: LegalDocumentId;
  title: string;
  lastUpdatedLabel: string;
  intro?: string;
  blocks: LegalDocBlock[];
};

export const LEGAL_PAGE_PATHS: Record<LegalDocumentId, string> = {
  terms: "/terms",
  privacy: "/privacy",
  waiver: "/waiver",
};

export function isLegalPublicPath(pathname: string) {
  return (
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/waiver" ||
    pathname === "/legal/parent-consent"
  );
}

export function isMinorPlayerAge(playerAge: number | null | undefined) {
  return playerAge != null && playerAge < LEGAL_ADULT_AGE;
}

export function isUnder13ProgramAge(playerAge: number | null | undefined) {
  return playerAge != null && playerAge >= 8 && playerAge <= 11;
}

export function parseLegalPlayerAge(value: string | number | null | undefined) {
  if (typeof value === "number") {
    if (
      Number.isInteger(value) &&
      value >= LEGAL_MIN_PLAYER_AGE &&
      value <= LEGAL_MAX_PLAYER_AGE
    ) {
      return value;
    }
    return null;
  }

  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const age = Number(trimmed);
  if (
    !Number.isInteger(age) ||
    age < LEGAL_MIN_PLAYER_AGE ||
    age > LEGAL_MAX_PLAYER_AGE
  ) {
    return null;
  }

  return age;
}

export type LegalAcceptanceState = {
  termsVersion: string | null | undefined;
  playerAge?: number | null | undefined;
  acceptedAsParent?: boolean;
};

export function needsLegalAcceptance(state: LegalAcceptanceState) {
  if (!state.termsVersion || state.termsVersion !== LEGAL_DOCS_VERSION) {
    return true;
  }

  if (
    state.playerAge != null &&
    state.playerAge < LEGAL_ADULT_AGE &&
    !state.acceptedAsParent
  ) {
    return true;
  }

  return false;
}

export function validateAcceptedByName(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return "Enter your full name (at least first and last).";
  }

  if (value.trim().length < 3) {
    return "Enter your full name (at least first and last).";
  }

  return null;
}

export function validateParentConsentEmail(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter the parent or guardian email.";
  }

  if (!isValidEmailFormat(trimmed)) {
    return "Enter a valid parent or guardian email.";
  }

  return null;
}

export function formatLegalAgreementRole(acceptedAsParent: boolean) {
  return acceptedAsParent ? "Parent or guardian" : "Player (18+)";
}

export function formatMediaConsentLabel(mediaConsent: boolean) {
  return mediaConsent ? "Yes" : "No";
}

function formatParentConsentSinceDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatParentConsentStatus(params: {
  playerAge: number | null | undefined;
  parentConsentEmail: string | null | undefined;
  parentConsentConfirmedAt: Date | string | null | undefined;
  termsAcceptedAt: Date | string | null | undefined;
}) {
  if (!isMinorPlayerAge(params.playerAge) || !params.parentConsentEmail?.trim()) {
    return null;
  }

  if (params.parentConsentConfirmedAt) {
    return "Parent confirmed";
  }

  if (params.termsAcceptedAt) {
    return `Waiting on parent (since ${formatParentConsentSinceDate(params.termsAcceptedAt)})`;
  }

  return "Waiting on parent";
}
