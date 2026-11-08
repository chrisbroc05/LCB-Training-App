import "server-only";

import { resolveEffectiveLevel } from "@/lib/access-shared";
import { formatDateWithYear } from "@/lib/format-date";
import type { FoundingOfferOrgFields } from "@/lib/founding-offer-shared";
import { mergeOrgIntoAccessFields } from "@/lib/org-server";
import {
  buildPlayerEvaluationCtaContent,
  CORE_QUICK_REPORT_INTERVAL_MS,
  type PlayerEvaluationCtaTrack,
  type ReportRecommendedProductSlug,
} from "@/lib/player-evaluation-cta-shared";
import { formatPlayerDisplayName } from "@/lib/player-name-display-shared";
import { renderPlayerEvaluationPdfToBuffer } from "@/lib/player-evaluation-pdf-node";
import type { WrittenReportSections } from "@/lib/written-report-parse-shared";
import {
  normalizeWrittenReportLines,
  stripWrittenReportLinePrefix,
} from "@/lib/written-report-line-shared";
import { getDrillLibraryVideosByIds } from "@/lib/drill-library-videos";

function splitPlayerName(playerName: string) {
  const formatted = formatPlayerDisplayName(playerName);
  const parts = formatted.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Player", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: "" };
  }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export function buildPlayerEvaluationRecommendedDrillLines(
  sections: WrittenReportSections,
  libraryDrillIds: string[],
): string[] {
  const libraryTitles = getDrillLibraryVideosByIds(libraryDrillIds).map((video) => video.title);
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const line of [...sections.recommendedDrills, ...libraryTitles]) {
    const trimmed = stripWrittenReportLinePrefix(line.trim());
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    lines.push(trimmed);
  }

  return lines;
}

export function buildPlayerEvaluationTypedDrillLines(sections: WrittenReportSections): string[] {
  return normalizeWrittenReportLines(sections.recommendedDrills);
}

export function buildPlayerEvaluationLibraryDrillTitles(libraryDrillIds: string[]): string[] {
  return getDrillLibraryVideosByIds(libraryDrillIds).map((video) => video.title);
}

type PdfUserContext = Parameters<typeof mergeOrgIntoAccessFields>[0] & {
  organization?:
    | (NonNullable<Parameters<typeof mergeOrgIntoAccessFields>[0]["organization"]> & {
        foundingOfferEnabled?: boolean;
        foundingOfferDeadline?: Date | null;
        foundingOfferMonths?: number;
      })
    | null;
};

function normalizeWrittenReportSections(sections: WrittenReportSections): WrittenReportSections {
  return {
    strengths: normalizeWrittenReportLines(sections.strengths),
    areasToImprove: normalizeWrittenReportLines(sections.areasToImprove),
    recommendedDrills: normalizeWrittenReportLines(sections.recommendedDrills),
    noteFromCoach: stripWrittenReportLinePrefix(sections.noteFromCoach),
  };
}

function resolveFoundingFromUser(user: PdfUserContext | null | undefined): FoundingOfferOrgFields | null {
  const org = user?.organization;
  if (!org) {
    return null;
  }
  if (
    typeof org.foundingOfferEnabled !== "boolean" ||
    !("foundingOfferDeadline" in org) ||
    typeof org.foundingOfferMonths !== "number"
  ) {
    return null;
  }
  return {
    foundingOfferEnabled: org.foundingOfferEnabled,
    foundingOfferDeadline: org.foundingOfferDeadline ?? null,
    foundingOfferMonths: org.foundingOfferMonths,
  };
}

export async function generatePlayerEvaluationPdfBuffer(params: {
  playerName: string;
  teamLabel: string;
  evalDate: Date;
  sections: WrittenReportSections;
  libraryDrillIds: string[];
  reviewTrack: PlayerEvaluationCtaTrack;
  recommendedFixItSlug?: ReportRecommendedProductSlug | null;
  user?: PdfUserContext | null;
}) {
  const { firstName, lastName } = splitPlayerName(params.playerName);
  const sections = normalizeWrittenReportSections(params.sections);
  const typedDrills = buildPlayerEvaluationTypedDrillLines(sections);
  const libraryDrillTitles = buildPlayerEvaluationLibraryDrillTitles(params.libraryDrillIds);

  const accessFields = params.user ? mergeOrgIntoAccessFields(params.user) : null;
  const effective = accessFields ? resolveEffectiveLevel(accessFields) : null;
  const membershipIncludesFixIt = effective === "PLUS" || effective === "ALL_ACCESS";

  let coreNextEligibleAt: Date | null = null;
  if (params.reviewTrack === "QUICK_SIX_WEEK") {
    coreNextEligibleAt = new Date(params.evalDate.getTime() + CORE_QUICK_REPORT_INTERVAL_MS);
  }

  const cta = buildPlayerEvaluationCtaContent({
    firstName,
    reviewTrack: params.reviewTrack,
    recommendedFixItSlug: params.recommendedFixItSlug,
    membershipIncludesFixIt,
    coreNextEligibleAt,
    orgTrialEndsAt: accessFields?.orgTrialEndsAt
      ? new Date(accessFields.orgTrialEndsAt)
      : null,
    orgName: accessFields?.orgName ?? null,
    founding: resolveFoundingFromUser(params.user),
  });

  return renderPlayerEvaluationPdfToBuffer({
    firstName,
    lastName,
    teamLabel: params.teamLabel.trim() || "LCB Training",
    evalDateLabel: formatDateWithYear(params.evalDate),
    strengths: sections.strengths,
    areasToImprove: sections.areasToImprove,
    recommendedDrills: typedDrills,
    libraryDrillTitles,
    noteFromCoach: sections.noteFromCoach,
    cta,
  });
}
