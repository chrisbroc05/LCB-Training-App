import "server-only";

import {
  previewDailyChallengeCsv,
  type DailyChallengeCsvChallengePreviewRow,
  type DailyChallengeCsvImportPreview,
  type DailyChallengeCsvQuestionPreviewRow,
} from "@/lib/daily-challenge-csv-shared";
import {
  upsertAdminDailyChallenge,
  upsertAdminDailyQuestion,
} from "@/lib/daily-challenge-server";
import { prisma } from "@/lib/prisma";

function challengeKey(ageGroup: string, rotationDay: number) {
  return `${ageGroup}|${rotationDay}`;
}

function questionKey(type: string, ageGroup: string | null, rotationDay: number) {
  return `${type}|${ageGroup ?? "ALL"}|${rotationDay}`;
}

export async function previewDailyChallengeCsvImport(
  csvText: string,
): Promise<DailyChallengeCsvImportPreview> {
  const preview = previewDailyChallengeCsv(csvText);
  if (!preview.ok) {
    return preview;
  }

  const existingChallenges = await prisma.dailyChallenge.findMany({
    select: { ageGroup: true, rotationDay: true },
  });
  const existingChallengeKeys = new Set(
    existingChallenges.map((row) => challengeKey(row.ageGroup, row.rotationDay)),
  );

  const existingQuestions = await prisma.dailyQuestion.findMany({
    select: { type: true, ageGroup: true, rotationDay: true },
  });
  const existingQuestionKeys = new Set(
    existingQuestions.map((row) => questionKey(row.type, row.ageGroup, row.rotationDay)),
  );

  let challengesCreated = 0;
  let challengesUpdated = 0;
  const challenges: DailyChallengeCsvChallengePreviewRow[] = preview.challenges.map((row) => {
    const exists = existingChallengeKeys.has(challengeKey(row.ageGroup, row.rotationDay));
    if (exists) {
      challengesUpdated += 1;
    } else {
      challengesCreated += 1;
    }
    return {
      ...row,
      importAction: exists ? "update" : "create",
    };
  });

  let questionsCreated = 0;
  let questionsUpdated = 0;
  const questions: DailyChallengeCsvQuestionPreviewRow[] = preview.questions.map((row) => {
    const exists = existingQuestionKeys.has(questionKey(row.type, row.ageGroup, row.rotationDay));
    if (exists) {
      questionsUpdated += 1;
    } else {
      questionsCreated += 1;
    }
    return {
      ...row,
      importAction: exists ? "update" : "create",
    };
  });

  return {
    ok: true,
    challenges,
    questions,
    warnings: preview.warnings,
    challengesCreated,
    challengesUpdated,
    questionsCreated,
    questionsUpdated,
  };
}

export async function commitDailyChallengeCsvImport(csvText: string) {
  const preview = await previewDailyChallengeCsvImport(csvText);
  if (!preview.ok) {
    return { ok: false as const, error: preview.error };
  }

  let challengesCreated = 0;
  let challengesUpdated = 0;
  let questionsCreated = 0;
  let questionsUpdated = 0;

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
    if (result.created) {
      challengesCreated += 1;
    } else {
      challengesUpdated += 1;
    }
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
    if (result.created) {
      questionsCreated += 1;
    } else {
      questionsUpdated += 1;
    }
  }

  return {
    ok: true as const,
    result: {
      challengesCreated,
      challengesUpdated,
      questionsCreated,
      questionsUpdated,
      challengesUpserted: challengesCreated + challengesUpdated,
      questionsUpserted: questionsCreated + questionsUpdated,
      warnings: preview.warnings,
    },
  };
}
