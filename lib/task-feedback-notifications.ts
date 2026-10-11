import "server-only";

import { isPlayerPushQuietHours } from "@/lib/direct-messaging-quiet-hours";
import { buildEmailButton, buildMemberEmailHtml, getPublicAppUrl } from "@/lib/email-layout";
import { sendProgramEmail } from "@/lib/program-email-send";
import { sendPushToUserSafe, userHasPushSubscriptions } from "@/lib/push-send";
import { prisma } from "@/lib/prisma";

export const COACH_TASK_FEEDBACK_PUSH_TITLE = "Coach Broc left you feedback";
export const COACH_TASK_FEEDBACK_PUSH_BODY = "Tap to take a look.";

const COOLDOWN_MS = 30 * 60 * 1000;

function isWithinNotifyCooldown(lastAt: Date | null | undefined, now: Date) {
  if (!lastAt) {
    return false;
  }
  return now.getTime() - lastAt.getTime() < COOLDOWN_MS;
}

async function buildFeedbackViewUrl(enrollmentId: string) {
  const unseen = await prisma.taskFeedback.findMany({
    where: {
      enrollmentId,
      seenAt: null,
      OR: [{ liked: true }, { comment: { not: null } }],
    },
    orderBy: [{ programDay: "desc" }, { updatedAt: "desc" }],
    select: { programDay: true },
  });

  if (unseen.length === 1) {
    return `/dashboard/today?programDay=${unseen[0]!.programDay}#coach-feedback`;
  }

  return "/dashboard/today#coach-feedback";
}

async function markFeedbackNotified(enrollmentId: string, now: Date) {
  await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: {
      lastTaskFeedbackNotifyAt: now,
      taskFeedbackNotifyPending: false,
    },
  });
}

async function sendFeedbackEmail(params: {
  enrollmentId: string;
  toEmail: string;
  urlPath: string;
  now: Date;
}) {
  const viewUrl = `${getPublicAppUrl()}${params.urlPath}`;
  const subject = COACH_TASK_FEEDBACK_PUSH_TITLE;
  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${subject}</h1>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${COACH_TASK_FEEDBACK_PUSH_BODY}</p>
      ${buildEmailButton("View feedback", viewUrl)}`;
  const text = `${subject}\n\n${COACH_TASK_FEEDBACK_PUSH_BODY}\n\nView feedback: ${viewUrl}`;

  await sendProgramEmail({
    to: params.toEmail,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
    enrollmentId: params.enrollmentId,
    recipient: "player",
    type: "COACH_TASK_FEEDBACK",
    dateKey: `coach-task-feedback-email:${params.enrollmentId}:${params.now.toISOString()}`,
  });
}

async function deliverTaskFeedbackNotification(params: {
  userId: string;
  enrollmentId: string;
  userEmail: string;
  now: Date;
}) {
  const url = await buildFeedbackViewUrl(params.enrollmentId);
  const dedupeKey = `coach-task-feedback:${params.enrollmentId}:${params.now.getTime()}`;

  const hasPush = await userHasPushSubscriptions(params.userId);
  if (hasPush) {
    const result = await sendPushToUserSafe(
      params.userId,
      {
        title: COACH_TASK_FEEDBACK_PUSH_TITLE,
        body: COACH_TASK_FEEDBACK_PUSH_BODY,
        url,
      },
      { type: "COACH_TASK_FEEDBACK", dedupeKey },
    );

    if (result.sent > 0) {
      await markFeedbackNotified(params.enrollmentId, params.now);
    }
    return;
  }

  if (!params.userEmail) {
    return;
  }

  await sendFeedbackEmail({
    enrollmentId: params.enrollmentId,
    toEmail: params.userEmail,
    urlPath: url,
    now: params.now,
  });
  await markFeedbackNotified(params.enrollmentId, params.now);
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
  try {
    const now = new Date();

    const enrollment = await prisma.programEnrollment.findUnique({
      where: { id: params.enrollmentId },
      select: {
        lastTaskFeedbackNotifyAt: true,
        user: { select: { email: true } },
      },
    });

    if (!enrollment) {
      return;
    }

    if (isWithinNotifyCooldown(enrollment.lastTaskFeedbackNotifyAt, now)) {
      return;
    }

    if (isPlayerPushQuietHours(now)) {
      await prisma.programEnrollment.update({
        where: { id: params.enrollmentId },
        data: { taskFeedbackNotifyPending: true },
      });
      return;
    }

    await deliverTaskFeedbackNotification({
      userId: params.userId,
      enrollmentId: params.enrollmentId,
      userEmail: enrollment.user.email,
      now,
    });
  } catch (error) {
    console.error("Task feedback notification failed", error);
  }
}

export async function processQueuedTaskFeedbackNotifications(now = new Date()) {
  if (isPlayerPushQuietHours(now)) {
    return;
  }

  const pending = await prisma.programEnrollment.findMany({
    where: { taskFeedbackNotifyPending: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  for (const enrollment of pending) {
    try {
      await deliverTaskFeedbackNotification({
        userId: enrollment.user.id,
        enrollmentId: enrollment.id,
        userEmail: enrollment.user.email,
        now,
      });
    } catch (error) {
      console.error("Queued task feedback notification failed", error);
    }
  }
}

export async function sendTestTaskFeedbackPush(params: { userId: string; enrollmentId: string }) {
  const url = await buildFeedbackViewUrl(params.enrollmentId);
  const result = await sendPushToUserSafe(
    params.userId,
    {
      title: COACH_TASK_FEEDBACK_PUSH_TITLE,
      body: COACH_TASK_FEEDBACK_PUSH_BODY,
      url,
    },
    {
      type: "COACH_TASK_FEEDBACK",
      dedupeKey: `coach-task-feedback:test:${Date.now()}`,
      skipDedupeCheck: true,
    },
  );

  if (result.sent === 0) {
    throw new Error("Unable to send test feedback push.");
  }
}
