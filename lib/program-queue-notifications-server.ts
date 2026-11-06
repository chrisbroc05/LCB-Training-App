import "server-only";

import {
  COACH_REPLY_PUSH_TITLE,
  truncateMessagePreview,
} from "@/lib/direct-messaging-shared";
import { COACH_VIDEO_PUSH_TITLE } from "@/lib/coach-video-notifications";
import { COACH_TASK_FEEDBACK_PUSH_TITLE } from "@/lib/task-feedback-notifications";
import { getProgramCronStaleQueueMaxAgeMs } from "@/lib/program-cron-stale-shared";
import { prisma } from "@/lib/prisma";
import { processQueuedPlayerCoachReplyNotifications } from "@/lib/direct-messaging-notifications";
import { processQueuedCoachVideoNotifications } from "@/lib/coach-video-notifications";
import { processQueuedTaskFeedbackNotifications } from "@/lib/task-feedback-notifications";

export type ProgramQueuedNotificationPreview = {
  channel: "queued-notification";
  kind: "COACH_REPLY" | "COACH_VIDEO" | "COACH_TASK_FEEDBACK";
  id: string;
  title: string;
  detail: string;
  stale: boolean;
};

function staleCutoff(now: Date) {
  return new Date(now.getTime() - getProgramCronStaleQueueMaxAgeMs());
}

export async function buildProgramQueuedNotificationPreviews(
  now = new Date(),
): Promise<ProgramQueuedNotificationPreview[]> {
  const cutoff = staleCutoff(now);
  const previews: ProgramQueuedNotificationPreview[] = [];

  const pendingConversations = await prisma.conversation.findMany({
    where: { playerReplyNotifyPending: true },
    select: {
      id: true,
      lastMessageAt: true,
      playerReplyNotifyMessageId: true,
    },
  });

  for (const conversation of pendingConversations) {
    const stale = conversation.lastMessageAt < cutoff;
    let detail = "Pending coach reply notification.";
    if (conversation.playerReplyNotifyMessageId) {
      const message = await prisma.message.findUnique({
        where: { id: conversation.playerReplyNotifyMessageId },
        select: { body: true },
      });
      if (message) {
        detail = truncateMessagePreview(message.body, 120);
      }
    }
    previews.push({
      channel: "queued-notification",
      kind: "COACH_REPLY",
      id: conversation.id,
      title: COACH_REPLY_PUSH_TITLE,
      detail,
      stale,
    });
  }

  const pendingVideos = await prisma.coachVideo.findMany({
    where: { notifyPending: true },
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  for (const video of pendingVideos) {
    previews.push({
      channel: "queued-notification",
      kind: "COACH_VIDEO",
      id: video.id,
      title: COACH_VIDEO_PUSH_TITLE,
      detail: video.title,
      stale: video.createdAt < cutoff,
    });
  }

  const pendingFeedback = await prisma.programEnrollment.findMany({
    where: { taskFeedbackNotifyPending: true },
    select: {
      id: true,
      updatedAt: true,
      taskFeedbacks: {
        where: {
          seenAt: null,
          OR: [{ liked: true }, { comment: { not: null } }],
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { updatedAt: true },
      },
    },
  });

  for (const enrollment of pendingFeedback) {
    const feedbackAt = enrollment.taskFeedbacks[0]?.updatedAt;
    const effectiveAt =
      feedbackAt && feedbackAt > enrollment.updatedAt ? feedbackAt : enrollment.updatedAt;
    previews.push({
      channel: "queued-notification",
      kind: "COACH_TASK_FEEDBACK",
      id: enrollment.id,
      title: COACH_TASK_FEEDBACK_PUSH_TITLE,
      detail: "Pending task feedback notification.",
      stale: effectiveAt < cutoff,
    });
  }

  return previews;
}

/** Clears stale queue flags before first delivery attempt; logs each skip. */
export async function skipStaleProgramQueuedNotifications(now = new Date()) {
  const cutoff = staleCutoff(now);
  let coachReplySkipped = 0;
  let coachVideoSkipped = 0;
  let taskFeedbackSkipped = 0;

  const staleConversations = await prisma.conversation.findMany({
    where: {
      playerReplyNotifyPending: true,
      lastMessageAt: { lt: cutoff },
    },
    select: { id: true },
  });

  for (const row of staleConversations) {
    await prisma.conversation.update({
      where: { id: row.id },
      data: {
        playerReplyNotifyPending: false,
        playerReplyNotifyMessageId: null,
      },
    });
    coachReplySkipped += 1;
    console.warn(
      `[program-cron] stale queue skip: COACH_REPLY conversation=${row.id} (lastMessageAt before cutoff)`,
    );
  }

  const staleVideos = await prisma.coachVideo.findMany({
    where: {
      notifyPending: true,
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });

  for (const row of staleVideos) {
    await prisma.coachVideo.update({
      where: { id: row.id },
      data: { notifyPending: false },
    });
    coachVideoSkipped += 1;
    console.warn(`[program-cron] stale queue skip: COACH_VIDEO video=${row.id} (createdAt before cutoff)`);
  }

  const staleEnrollments = await prisma.programEnrollment.findMany({
    where: { taskFeedbackNotifyPending: true },
    select: {
      id: true,
      updatedAt: true,
      taskFeedbacks: {
        where: {
          seenAt: null,
          OR: [{ liked: true }, { comment: { not: null } }],
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { updatedAt: true },
      },
    },
  });

  for (const row of staleEnrollments) {
    const feedbackAt = row.taskFeedbacks[0]?.updatedAt;
    const effectiveAt = feedbackAt && feedbackAt > row.updatedAt ? feedbackAt : row.updatedAt;
    if (effectiveAt >= cutoff) {
      continue;
    }
    await prisma.programEnrollment.update({
      where: { id: row.id },
      data: { taskFeedbackNotifyPending: false },
    });
    taskFeedbackSkipped += 1;
    console.warn(
      `[program-cron] stale queue skip: COACH_TASK_FEEDBACK enrollment=${row.id} (pending before cutoff)`,
    );
  }

  return {
    coachReplySkipped,
    coachVideoSkipped,
    taskFeedbackSkipped,
  };
}

export async function processProgramQueuedNotificationsAfterStalePass(now = new Date()) {
  await processQueuedPlayerCoachReplyNotifications(now);
  await processQueuedCoachVideoNotifications(now);
  await processQueuedTaskFeedbackNotifications(now);
}
