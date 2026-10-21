import "server-only";

import {
  PLAYER_IQ_QUESTIONS,
  type PlayerIqAnswers,
  type PlayerIqLevel,
} from "@/lib/player-iq-quiz-shared";
import { prisma } from "@/lib/prisma";

export async function loadQuizAdminDashboard() {
  const attempts = await prisma.quizAttempt.findMany({
    where: { completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 500,
    include: {
      lead: { select: { firstName: true, email: true } },
      user: { select: { name: true, email: true } },
    },
  });

  const completed = attempts.filter((attempt) => attempt.score !== null);
  const totalCompleted = completed.length;
  const averageScore =
    totalCompleted > 0
      ? completed.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / totalCompleted
      : 0;

  const levelCounts: Record<PlayerIqLevel, number> = {
    ROOKIE: 0,
    STARTER: 0,
    ALL_CONFERENCE: 0,
    MEMORABLE: 0,
  };

  for (const attempt of completed) {
    const level = attempt.level as PlayerIqLevel | null;
    if (level && level in levelCounts) {
      levelCounts[level] += 1;
    }
  }

  const questionStats = PLAYER_IQ_QUESTIONS.map((question) => {
    let correct = 0;
    let answered = 0;
    for (const attempt of completed) {
      const answers = attempt.answers as PlayerIqAnswers;
      const selected = answers[question.id];
      if (selected) {
        answered += 1;
        if (selected === question.correctOptionId) {
          correct += 1;
        }
      }
    }
    const percentCorrect = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return {
      questionId: question.id,
      order: question.order,
      prompt: question.prompt,
      difficulty: question.difficulty,
      percentCorrect,
      answered,
    };
  });

  const rows = attempts.map((attempt) => {
    const name =
      attempt.lead?.firstName ??
      attempt.user?.name?.split(/\s+/)[0] ??
      "Unknown";
    const email = attempt.lead?.email ?? attempt.user?.email ?? "";
    const categoryScores = attempt.categoryScores as Record<string, number> | null;
    return {
      id: attempt.id,
      name,
      email,
      role: attempt.role,
      score: attempt.score,
      level: attempt.level,
      mindset: categoryScores?.mindset ?? null,
      gameIq: categoryScores?.gameIq ?? null,
      training: categoryScores?.training ?? null,
      completedAt: attempt.completedAt?.toISOString() ?? null,
    };
  });

  return {
    rows,
    totalCompleted,
    averageScore: Math.round(averageScore * 10) / 10,
    levelCounts,
    questionStats,
  };
}

export function buildQuizAttemptsCsv(
  rows: Awaited<ReturnType<typeof loadQuizAdminDashboard>>["rows"],
) {
  const header = [
    "completed_at",
    "name",
    "email",
    "role",
    "score",
    "level",
    "mindset",
    "game_iq",
    "training",
    "attempt_id",
  ].join(",");
  const lines = rows.map((row) =>
    [
      row.completedAt ?? "",
      csvEscape(row.name),
      csvEscape(row.email),
      row.role,
      row.score ?? "",
      row.level ?? "",
      row.mindset ?? "",
      row.gameIq ?? "",
      row.training ?? "",
      row.id,
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function countQuizCompletionsForDay(dayStart: Date, dayEnd: Date) {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      completedAt: { gte: dayStart, lt: dayEnd },
      score: { not: null },
    },
    select: { score: true },
  });

  if (attempts.length === 0) {
    return { count: 0, averageScore: 0 };
  }

  const averageScore =
    attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / attempts.length;

  return {
    count: attempts.length,
    averageScore: Math.round(averageScore * 10) / 10,
  };
}
