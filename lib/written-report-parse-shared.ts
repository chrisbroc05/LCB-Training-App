/**
 * Parse admin paste for quick written player evaluation reports (client-safe).
 */

import { normalizeWrittenReportLines, stripWrittenReportLinePrefix } from "@/lib/written-report-line-shared";

export const WRITTEN_REPORT_HEADINGS = [
  "STRENGTHS:",
  "AREAS TO IMPROVE:",
  "RECOMMENDED DRILLS:",
  "NOTE FROM COACH BROC:",
] as const;

export type WrittenReportSections = {
  strengths: string[];
  areasToImprove: string[];
  recommendedDrills: string[];
  noteFromCoach: string;
};

export type WrittenReportParseResult =
  | { ok: true; sections: WrittenReportSections }
  | { ok: false; error: string };

function normalizeNewlines(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function splitSectionLines(block: string): string[] {
  return normalizeWrittenReportLines(
    block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  );
}

type ExtractedBlocks = { ok: true; blocks: string[] } | { ok: false; error: string };

function extractSections(raw: string): ExtractedBlocks {
  const text = normalizeNewlines(raw.trim());
  if (!text) {
    return { ok: false, error: "Paste your report text with all required headings." };
  }

  const upper = text.toUpperCase();
  const headingIndices: { heading: (typeof WRITTEN_REPORT_HEADINGS)[number]; index: number }[] = [];

  for (const heading of WRITTEN_REPORT_HEADINGS) {
    const index = upper.indexOf(heading);
    if (index < 0) {
      return { ok: false, error: `Missing required heading: ${heading}` };
    }
    headingIndices.push({ heading, index });
  }

  headingIndices.sort((a, b) => a.index - b.index);

  for (let i = 0; i < WRITTEN_REPORT_HEADINGS.length; i += 1) {
    if (headingIndices[i]?.heading !== WRITTEN_REPORT_HEADINGS[i]) {
      return {
        ok: false,
        error: `Headings must appear in order: ${WRITTEN_REPORT_HEADINGS.join(" ")}`,
      };
    }
  }

  const blocks: string[] = [];
  for (let i = 0; i < headingIndices.length; i += 1) {
    const start = headingIndices[i]!.index + headingIndices[i]!.heading.length;
    const end =
      i + 1 < headingIndices.length ? headingIndices[i + 1]!.index : text.length;
    blocks.push(text.slice(start, end).trim());
  }

  return { ok: true, blocks };
}

export function parseWrittenReportPaste(raw: string): WrittenReportParseResult {
  const extracted = extractSections(raw);
  if (!extracted.ok) {
    return { ok: false, error: extracted.error };
  }

  const [strengthsBlock, areasBlock, drillsBlock, noteBlock] = extracted.blocks;
  const strengths = splitSectionLines(strengthsBlock ?? "");
  const areasToImprove = splitSectionLines(areasBlock ?? "");
  const recommendedDrills = splitSectionLines(drillsBlock ?? "");
  const noteFromCoach = stripWrittenReportLinePrefix((noteBlock ?? "").trim());

  if (strengths.length === 0) {
    return { ok: false, error: "Add at least one line under STRENGTHS:" };
  }
  if (areasToImprove.length === 0) {
    return { ok: false, error: "Add at least one line under AREAS TO IMPROVE:" };
  }
  if (recommendedDrills.length === 0) {
    return { ok: false, error: "Add at least one line under RECOMMENDED DRILLS:" };
  }
  if (!noteFromCoach) {
    return { ok: false, error: "Add text under NOTE FROM COACH BROC:" };
  }

  return {
    ok: true,
    sections: {
      strengths,
      areasToImprove,
      recommendedDrills,
      noteFromCoach,
    },
  };
}

export function buildWrittenReportResponseText(sections: WrittenReportSections): string {
  const formatLines = (label: string, lines: string[]) =>
    `${label}\n${lines.map((line) => `- ${line}`).join("\n")}`;

  return [
    formatLines("Strengths", sections.strengths),
    formatLines("Areas to Improve", sections.areasToImprove),
    formatLines("Recommended Drills", sections.recommendedDrills),
    `Note from Coach Broc\n${sections.noteFromCoach}`,
  ].join("\n\n");
}
