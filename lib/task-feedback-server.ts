import "server-only";

import { validateTaskFeedbackComment } from "@/lib/task-feedback-shared";
import { prisma } from "@/lib/prisma";
import { notifyPlayerOfTaskFeedback } from "@/lib/task-feedback-notifications";

export async function upsertTaskFeedback(params: {
  enrollmentId: string;
  userId: string;
  programDay: number;
  taskKey: string;
  liked?: boolean;
  comment?: string | null;
  taskCompletionId?: string | null;
}) {
  if (params.programDay < 1 || params.programDay > 84) {
    throw new Error("Invalid program day.");
  }

  const commentResult = validateTaskFeedbackComment(params.comment);
  if (!commentResult.ok) {
    throw new Error(commentResult.error);
  }

  const existing = await prisma.taskFeedback.findUnique({
    where: {
      enrollmentId_programDay_taskKey: {
        enrollmentId: params.enrollmentId,
        programDay: params.programDay,
        taskKey: params.taskKey,
      },
    },
  });

  const liked = params.liked ?? existing?.liked ?? false;
  const comment = params.comment !== undefined ? commentResult.comment : (existing?.comment ?? null);

  if (!liked && !comment) {
    if (existing) {
      await prisma.taskFeedback.delete({ where: { id: existing.id } });
      return null;
    }
    return null;
  }

  const feedback = await prisma.taskFeedback.upsert({
    where: {
      enrollmentId_programDay_taskKey: {
        enrollmentId: params.enrollmentId,
        programDay: params.programDay,
        taskKey: params.taskKey,
      },
    },
    create: {
      enrollmentId: params.enrollmentId,
      programDay: params.programDay,
      taskKey: params.taskKey,
      taskCompletionId: params.taskCompletionId ?? null,
      liked,
      comment,
      seenAt: null,
    },
    update: {
      liked,
      comment,
      taskCompletionId: params.taskCompletionId ?? undefined,
      seenAt: null,
      updatedAt: new Date(),
    },
  });

  void notifyPlayerOfTaskFeedback({
    userId: params.userId,
    enrollmentId: params.enrollmentId,
    feedbackId: feedback.id,
    programDay: params.programDay,
    taskKey: params.taskKey,
    liked,
    comment,
  }).catch((error) => {
    console.error("Task feedback notify hook failed", error);
  });

  return feedback;
}

export async function markTaskFeedbackSeenForProgramDay(
  enrollmentId: string,
  programDay: number,
) {
  await prisma.taskFeedback.updateMany({
    where: {
      enrollmentId,
      programDay,
      seenAt: null,
    },
    data: { seenAt: new Date() },
  });
}

export async function loadTaskFeedbackMap(enrollmentId: string) {
  const rows = await prisma.taskFeedback.findMany({
    where: { enrollmentId },
  });

  const map = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    map.set(`${row.programDay}:${row.taskKey}`, row);
  }
  return map;
}

export async function loadUnseenTaskFeedbackForPlayer(enrollmentId: string) {
  return prisma.taskFeedback.findMany({
    where: {
      enrollmentId,
      seenAt: null,
      OR: [{ liked: true }, { comment: { not: null } }],
    },
    orderBy: [{ programDay: "desc" }, { updatedAt: "desc" }],
  });
}
