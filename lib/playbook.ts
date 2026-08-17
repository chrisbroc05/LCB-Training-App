import { PLAYBOOK_CHAPTERS } from "@/lib/playbook-content";
import { prisma } from "@/lib/prisma";

export type PlaybookChapterStatus = "not_started" | "in_progress" | "complete";

const progressInclude = {
  chapters: {
    orderBy: { chapterNumber: "asc" as const },
    include: {
      reflections: {
        orderBy: { questionNumber: "asc" as const },
      },
    },
  },
};

export async function ensurePlaybookProgress(userId: string) {
  const existing = await prisma.playbookProgress.findUnique({
    where: { userId },
    include: progressInclude,
  });

  if (existing) {
    return existing;
  }

  return prisma.playbookProgress.create({
    data: {
      userId,
      chapters: {
        create: PLAYBOOK_CHAPTERS.map((chapter) => ({
          chapterNumber: chapter.number,
          chapterTitle: chapter.title,
        })),
      },
    },
    include: progressInclude,
  });
}

export function getChapterStatus(
  completed: boolean,
  reflections: Array<{ answer: string | null }>,
): PlaybookChapterStatus {
  if (completed) {
    return "complete";
  }

  const hasSavedAnswers = reflections.some((reflection) => Boolean(reflection.answer?.trim()));
  if (hasSavedAnswers) {
    return "in_progress";
  }

  return "not_started";
}

export function getPlaybookCompletionStats(
  chapters: Array<{
    completed: boolean;
    reflections: Array<{ answer: string | null }>;
  }>,
) {
  const completedCount = chapters.filter((chapter) => chapter.completed).length;
  const totalCount = PLAYBOOK_CHAPTERS.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percentComplete,
  };
}

export function getCurrentChapterNumber(
  chapters: Array<{
    chapterNumber: number;
    completed: boolean;
    reflections: Array<{ answer: string | null }>;
  }>,
) {
  const incomplete = chapters.find((chapter) => !chapter.completed);
  return incomplete?.chapterNumber ?? 1;
}

export function chapterHasSavedAnswers(reflections: Array<{ answer: string | null }>) {
  return reflections.some((reflection) => Boolean(reflection.answer?.trim()));
}

export function serializePlaybookProgress(
  progress: Awaited<ReturnType<typeof ensurePlaybookProgress>>,
) {
  const stats = getPlaybookCompletionStats(progress.chapters);

  return {
    overallComplete: progress.overallComplete,
    completedAt: progress.completedAt?.toISOString() ?? null,
    completedCount: stats.completedCount,
    totalCount: stats.totalCount,
    percentComplete: stats.percentComplete,
    currentChapterNumber: getCurrentChapterNumber(progress.chapters),
    chapters: progress.chapters.map((chapter) => ({
      chapterNumber: chapter.chapterNumber,
      chapterTitle: chapter.chapterTitle,
      completed: chapter.completed,
      completedAt: chapter.completedAt?.toISOString() ?? null,
      status: getChapterStatus(chapter.completed, chapter.reflections),
      reflections: chapter.reflections.map((reflection) => ({
        questionNumber: reflection.questionNumber,
        questionText: reflection.questionText,
        answer: reflection.answer,
        sharedWithCoach: reflection.sharedWithCoach,
        sharedAt: reflection.sharedAt?.toISOString() ?? null,
        updatedAt: reflection.updatedAt.toISOString(),
      })),
    })),
  };
}

export async function markChapterComplete(userId: string, chapterNumber: number) {
  const progress = await ensurePlaybookProgress(userId);
  const chapter = progress.chapters.find((item) => item.chapterNumber === chapterNumber);

  if (!chapter) {
    return { ok: false as const, error: "Chapter not found." };
  }

  if (!chapterHasSavedAnswers(chapter.reflections)) {
    return { ok: false as const, error: "Save your reflection answers before completing this chapter." };
  }

  await prisma.playbookChapter.update({
    where: { id: chapter.id },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  });

  const updatedChapters = await prisma.playbookChapter.findMany({
    where: { progressId: progress.id },
    select: { completed: true },
  });

  const allComplete = updatedChapters.every((item) => item.completed);
  if (allComplete) {
    await prisma.playbookProgress.update({
      where: { id: progress.id },
      data: {
        overallComplete: true,
        completedAt: new Date(),
      },
    });
  }

  return { ok: true as const, allComplete };
}
