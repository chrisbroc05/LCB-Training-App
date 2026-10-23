/**
 * Match pasted drill lines to library ids for grants (client-safe).
 */

import { getDrillLibraryVideoId } from "@/lib/drill-library-videos";
import { resolveFixItDrillVideoByTitle } from "@/lib/fix-it-plans-shared";

export function resolveDrillIdsFromReportLines(lines: readonly string[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const video = resolveFixItDrillVideoByTitle(line);
    if (!video) {
      continue;
    }
    const drillId = getDrillLibraryVideoId(video);
    if (!drillId || seen.has(drillId)) {
      continue;
    }
    seen.add(drillId);
    ids.push(drillId);
  }

  return ids;
}

export function mergeReportLibraryDrillIds(
  pickerIds: readonly string[],
  parsedLineIds: readonly string[],
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const drillId of [...pickerIds, ...parsedLineIds]) {
    const trimmed = drillId.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    merged.push(trimmed);
  }

  return merged;
}
