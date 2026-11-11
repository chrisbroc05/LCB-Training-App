import "server-only";

import {
  previewDailyChallengeCsv,
  type DailyChallengeCsvPreview,
} from "@/lib/daily-challenge-csv-shared";
import {
  upsertAdminDailyChallenge,
  upsertAdminDailyQuestion,
} from "@/lib/daily-challenge-server";

export async function previewDailyChallengeCsvImport(csvText: string): Promise<DailyChallengeCsvPreview> {
  return previewDailyChallengeCsv(csvText);
}

export async function commitDailyChallengeCsvImport(csvText: string) {
  const preview = previewDailyChallengeCsv(csvText);
  if (!preview.ok) {
    return { ok: false as const, error: preview.error };
  }

  let challengesUpserted = 0;
  let questionsUpserted = 0;

  for (const row of preview.challenges) {
    const result = await upsertAdminDailyChallenge({
      ageGroup: row.ageGroup,
      rotationDay: row.rotationDay,
      title: row.title,
      instructions: row.instructions,
      drillLibraryVimeoId: row.drillLibraryVimeoId,
      active: row.active,
    });
    if (!result.ok) {
      return { ok: false as const, error: `Challenge line ${row.lineNumber}: ${result.error}` };
    }
    challengesUpserted += 1;
  }

  for (const row of preview.questions) {
    const result = await upsertAdminDailyQuestion({
      ageGroup: row.ageGroup,
      rotationDay: row.rotationDay,
      type: row.type,
      prompt: row.prompt,
      options: row.options,
      correctOptionIndex: row.correctOptionIndex,
      explanation: row.explanation,
      active: row.active,
    });
    if (!result.ok) {
      return { ok: false as const, error: `Question line ${row.lineNumber}: ${result.error}` };
    }
    questionsUpserted += 1;
  }

  return {
    ok: true as const,
    result: {
      challengesUpserted,
      questionsUpserted,
      warnings: preview.warnings,
    },
  };
}
