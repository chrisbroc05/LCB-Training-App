export const LEGAL_DOCS_VERSION = "2026-09-29";

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
    pathname === "/waiver"
  );
}

export function needsLegalAcceptance(termsVersion: string | null | undefined) {
  return !termsVersion || termsVersion !== LEGAL_DOCS_VERSION;
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

export function formatLegalAgreementRole(acceptedAsParent: boolean) {
  return acceptedAsParent ? "Parent or guardian" : "Player (18+)";
}

export function formatMediaConsentLabel(mediaConsent: boolean) {
  return mediaConsent ? "Yes" : "No";
}
