import "server-only";

import { parseReportRecommendedFixItSlug } from "@/lib/player-evaluation-cta-shared";
import { parseWrittenReportPaste } from "@/lib/written-report-parse-shared";
import { parseWrittenReportLibraryDrillIds } from "@/lib/written-report-send-server";

export function parseAdminWrittenReportRequestBody(body: unknown) {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const paste = typeof record?.paste === "string" ? record.paste : "";
  const sectionsInput = record?.sections;

  let sectionsResult = parseWrittenReportPaste(paste);
  if (!sectionsResult.ok && sectionsInput && typeof sectionsInput === "object") {
    const sectionsRecord = sectionsInput as Record<string, unknown>;
    const strengths = Array.isArray(sectionsRecord.strengths)
      ? sectionsRecord.strengths.map(String).map((line) => line.trim()).filter(Boolean)
      : [];
    const areasToImprove = Array.isArray(sectionsRecord.areasToImprove)
      ? sectionsRecord.areasToImprove.map(String).map((line) => line.trim()).filter(Boolean)
      : [];
    const recommendedDrills = Array.isArray(sectionsRecord.recommendedDrills)
      ? sectionsRecord.recommendedDrills.map(String).map((line) => line.trim()).filter(Boolean)
      : [];
    const noteFromCoach =
      typeof sectionsRecord.noteFromCoach === "string" ? sectionsRecord.noteFromCoach.trim() : "";

    if (
      strengths.length > 0 &&
      areasToImprove.length > 0 &&
      recommendedDrills.length > 0 &&
      noteFromCoach
    ) {
      sectionsResult = {
        ok: true,
        sections: { strengths, areasToImprove, recommendedDrills, noteFromCoach },
      };
    }
  }

  if (!sectionsResult.ok) {
    return { ok: false as const, error: sectionsResult.error };
  }

  const drillParse = parseWrittenReportLibraryDrillIds(record?.libraryDrillIds ?? []);
  if (!drillParse.ok) {
    return { ok: false as const, error: drillParse.error };
  }

  if (drillParse.ids.length > 2) {
    return { ok: false as const, error: "Select up to 2 library drills." };
  }

  const fixItParse = parseReportRecommendedFixItSlug(record?.recommendedFixItSlug);
  if (!fixItParse.ok) {
    return { ok: false as const, error: fixItParse.error };
  }

  return {
    ok: true as const,
    sections: sectionsResult.sections,
    libraryDrillIds: drillParse.ids,
    recommendedFixItSlug: fixItParse.slug,
  };
}
