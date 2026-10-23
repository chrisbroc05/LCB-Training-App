import "server-only";

import { resolveEffectiveLevel } from "@/lib/access-shared";
import { formatDateWithYear } from "@/lib/format-date";
import { mergeOrgIntoAccessFields } from "@/lib/org-server";
import {
  buildPlayerEvaluationCtaContent,
  CORE_QUICK_REPORT_INTERVAL_MS,
  type PlayerEvaluationCtaTrack,
  type ReportRecommendedFixItSlug,
} from "@/lib/player-evaluation-cta-shared";
import { renderPlayerEvaluationPdfToBuffer } from "@/lib/player-evaluation-pdf-node";
import type { WrittenReportSections } from "@/lib/written-report-parse-shared";
import { getDrillLibraryVideosByIds } from "@/lib/drill-library-videos";

function splitPlayerName(playerName: string) {
  const parts = playerName.trim().split(/\s+/).filter(Boolean);
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
    const trimmed = line.trim();
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

type PdfUserContext = Parameters<typeof mergeOrgIntoAccessFields>[0];

export async function generatePlayerEvaluationPdfBuffer(params: {
  playerName: string;
  teamLabel: string;
  evalDate: Date;
  sections: WrittenReportSections;
  libraryDrillIds: string[];
  reviewTrack: PlayerEvaluationCtaTrack;
  recommendedFixItSlug?: ReportRecommendedFixItSlug | null;
  user?: PdfUserContext | null;
}) {
  const { firstName, lastName } = splitPlayerName(params.playerName);
  const recommendedDrills = buildPlayerEvaluationRecommendedDrillLines(
    params.sections,
    params.libraryDrillIds,
  );

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
  });

  return renderPlayerEvaluationPdfToBuffer({
    firstName,
    lastName,
    teamLabel: params.teamLabel.trim() || "LCB Training",
    evalDateLabel: formatDateWithYear(params.evalDate),
    strengths: params.sections.strengths,
    areasToImprove: params.sections.areasToImprove,
    recommendedDrills,
    noteFromCoach: params.sections.noteFromCoach,
    cta,
  });
}
