import "server-only";

import { getPlayerFirstName } from "@/lib/program-email-templates";
import {
  getChicagoDateTimeParts,
  getChicagoDayStart,
} from "@/lib/program-email-chicago";
import { isPlayerPushQuietHours } from "@/lib/direct-messaging-quiet-hours";
import { buildMemberEmailHtml, getPublicAppUrl } from "@/lib/email-layout";
import { hasProgramEmailBeenSent, sendProgramEmail } from "@/lib/program-email-send";
import { buildPushDedupeKey, sendPushToUser, userHasPushSubscriptions } from "@/lib/push-send";
import { getWeekdayNameForProgramDay } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

const BATCH_WINDOW_MS = 10 * 60 * 1000;

type PendingFeedbackBatch = {
  userId: string;
  enrollmentId: string;
  items: Array<{ programDay: number; taskKey: string; liked: boolean; comment: string | null }>;
  firstAt: number;
};

const pendingBatches = new Map<string, PendingFeedbackBatch>();

function getBatchKey(userId: string) {
  return userId;
}

export async function notifyPlayerOfTaskFeedback(params: {
  userId: string;
  enrollmentId: string;
  feedbackId: string;
  programDay: number;
  taskKey: string;
  liked: boolean;
  comment: string | null;
}) {
  const key = getBatchKey(params.userId);
  const now = Date.now();
  const existing = pendingBatches.get(key);

  if (existing && now - existing.firstAt < BATCH_WINDOW_MS) {
    existing.items.push({
      programDay: params.programDay,
      taskKey: params.taskKey,
      liked: params.liked,
      comment: params.comment,
    });
    pendingBatches.set(key, existing);
    scheduleBatchFlush(key);
    return;
  }

  pendingBatches.set(key, {
    userId: params.userId,
    enrollmentId: params.enrollmentId,
    items: [
      {
        programDay: params.programDay,
        taskKey: params.taskKey,
        liked: params.liked,
        comment: params.comment,
      },
    ],
    firstAt: now,
  });
  scheduleBatchFlush(key);
}

const flushTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleBatchFlush(key: string) {
  const existing = flushTimers.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  flushTimers.set(
    key,
    setTimeout(() => {
      flushTimers.delete(key);
      void flushFeedbackBatch(key);
    }, BATCH_WINDOW_MS),
  );
}

async function flushFeedbackBatch(key: string) {
  const batch = pendingBatches.get(key);
  if (!batch) {
    return;
  }
  pendingBatches.delete(key);

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { id: batch.enrollmentId },
    select: { startDate: true, user: { select: { name: true, email: true } } },
  });

  if (!enrollment?.startDate) {
    return;
  }

  const now = new Date();
  const { dateKey } = getChicagoDateTimeParts(now);
  const dedupeKey = buildPushDedupeKey(batch.userId, "COACH_TASK_FEEDBACK", `${dateKey}:${batch.firstAt}`);

  const hasPush = await userHasPushSubscriptions(batch.userId);
  const firstItem = batch.items[0]!;
  const weekday =
    enrollment.startDate && firstItem.programDay > 0
      ? getWeekdayNameForProgramDay(enrollment.startDate, firstItem.programDay)
      : "today";

  let title = "Coach Broc liked your task";
  let body = "Coach Broc left feedback on your work.";
  let url = `/dashboard/today?programDay=${firstItem.programDay}`;

  if (batch.items.length > 1) {
    title = "New feedback from Coach Broc";
    body = `Coach Broc left feedback on ${batch.items.length} tasks.`;
  } else if (firstItem.comment) {
    title = "Coach Broc commented on your task";
    const preview = firstItem.comment.slice(0, 80);
    body = `Re: ${weekday}: ${preview}${firstItem.comment.length > 80 ? "..." : ""}`;
  } else if (firstItem.liked) {
    body = `Coach Broc liked your task from ${weekday}.`;
  }

  const inQuietHours = isPlayerPushQuietHours(now);

  if (hasPush && !inQuietHours) {
    await sendPushToUser(
      batch.userId,
      { title, body, url },
      { type: "COACH_TASK_FEEDBACK", dedupeKey },
    );
    return;
  }

  const email = enrollment.user.email;
  if (!email) {
    return;
  }

  const emailDedupeKey = `coach-task-feedback:${batch.enrollmentId}:${batch.firstAt}`;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: batch.enrollmentId,
      recipient: "player",
      type: "COACH_TASK_FEEDBACK",
      dateKey: emailDedupeKey,
    })
  ) {
    return;
  }

  const watchUrl = `${getPublicAppUrl()}${url}`;
  const bodyContentHtml = `<p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#0A1628;">${body}</p>
    <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.5; color:#0A1628;"><a href="${watchUrl}">Open in the app</a></p>`;

  await sendProgramEmail({
    to: email,
    subject: title,
    html: buildMemberEmailHtml({ title, bodyContentHtml }),
    text: `${title}\n\n${body}\n\nOpen: ${watchUrl}`,
    enrollmentId: batch.enrollmentId,
    recipient: "player",
    type: "COACH_TASK_FEEDBACK",
    dateKey: emailDedupeKey,
  });
}
