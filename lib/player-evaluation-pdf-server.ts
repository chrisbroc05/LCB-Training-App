import "server-only";

import { execFile } from "node:child_process";
import { readFile, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { formatDateWithYear } from "@/lib/format-date";
import {
  getPlayerEvaluationPlatformNoteHtml,
  type PlayerEvaluationCtaTrack,
} from "@/lib/player-evaluation-cta-shared";
import type { WrittenReportSections } from "@/lib/written-report-parse-shared";
import { getDrillLibraryVideosByIds } from "@/lib/drill-library-videos";

const execFileAsync = promisify(execFile);

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

export async function generatePlayerEvaluationPdfBuffer(params: {
  playerName: string;
  teamLabel: string;
  evalDate: Date;
  sections: WrittenReportSections;
  libraryDrillIds: string[];
  reviewTrack: PlayerEvaluationCtaTrack;
}) {
  const { firstName, lastName } = splitPlayerName(params.playerName);
  const recommendedDrills = buildPlayerEvaluationRecommendedDrillLines(
    params.sections,
    params.libraryDrillIds,
  );
  const platformNoteHtml = getPlayerEvaluationPlatformNoteHtml(firstName, params.reviewTrack);

  const tempDir = os.tmpdir();
  const stamp = Date.now();
  const outputPath = path.join(tempDir, `lcb-player-eval-${stamp}.pdf`);
  const inputPath = path.join(tempDir, `lcb-player-eval-${stamp}.json`);

  const payload = {
    outputPath,
    platformNoteHtml,
    evaluation: {
      first_name: firstName,
      last_name: lastName,
      team: params.teamLabel.trim() || "LCB Training",
      eval_date: formatDateWithYear(params.evalDate),
      strengths: params.sections.strengths,
      areas_to_improve: params.sections.areasToImprove,
      recommended_drills: recommendedDrills,
      closing_note: params.sections.noteFromCoach,
    },
  };

  await writeFile(inputPath, JSON.stringify(payload));
  const scriptPath = path.join(process.cwd(), "scripts/render_player_eval_json.py");

  try {
    await execFileAsync("python3", [scriptPath, inputPath], {
      maxBuffer: 10 * 1024 * 1024,
    });
    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => undefined);
    await unlink(outputPath).catch(() => undefined);
  }
}
