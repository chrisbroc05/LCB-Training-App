import "server-only";

import { isPlayerPushQuietHours } from "@/lib/direct-messaging-quiet-hours";
import { buildEmailButton, buildMemberEmailHtml, escapeHtml, getPublicAppUrl } from "@/lib/email-layout";
import { hasProgramEmailBeenSent, sendProgramEmail } from "@/lib/program-email-send";
import { buildPushDedupeKey, sendPushToUserSafe, userHasPushSubscriptions } from "@/lib/push-send";
import { prisma } from "@/lib/prisma";

export const COACH_VIDEO_PUSH_TITLE = "Coach Broc sent you a video";

function buildCoachVideoUrl(coachVideoId: string) {
  return `/videos/${coachVideoId}`;
}

async function sendCoachVideoPush(params: {
  userId: string;
  coachVideoId: string;
  title: string;
  dateKey: string;
}) {
  const dedupeKey = buildPushDedupeKey(params.userId, "COACH_VIDEO", `${params.coachVideoId}:${params.dateKey}`);

  await sendPushToUserSafe(
    params.userId,
    {
      title: COACH_VIDEO_PUSH_TITLE,
      body: params.title,
      url: buildCoachVideoUrl(params.coachVideoId),
    },
    { type: "COACH_VIDEO", dedupeKey, skipDedupeCheck: true },
  );
}

async function sendCoachVideoEmail(params: {
  userId: string;
  toEmail: string;
  coachVideoId: string;
  title: string;
}) {
  const dedupeKey = `coach-video-email:${params.coachVideoId}`;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: null,
      recipient: "player",
      type: "COACH_VIDEO",
      dateKey: dedupeKey,
    })
  ) {
    return;
  }

  const watchUrl = `${getPublicAppUrl()}${buildCoachVideoUrl(params.coachVideoId)}`;
  const subject = COACH_VIDEO_PUSH_TITLE;
  const bodyContentHtml = `<h1 style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#0A1628;">${escapeHtml(subject)}</h1>
      <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#0A1628;">${escapeHtml(params.title)}</p>
      ${buildEmailButton("Watch video", watchUrl)}`;
  const text = `${subject}\n\n${params.title}\n\nWatch video: ${watchUrl}`;

  await sendProgramEmail({
    to: params.toEmail,
    subject,
    html: buildMemberEmailHtml({ title: subject, bodyContentHtml }),
    text,
    enrollmentId: null,
    recipient: "player",
    type: "COACH_VIDEO",
    dateKey: dedupeKey,
  });
}

export async function notifyPlayerOfCoachVideo(params: {
  coachVideoId: string;
  userId: string;
  userEmail: string;
  title: string;
  now?: Date;
}) {
  try {
    const now = params.now ?? new Date();
    const dateKey = now.toISOString().slice(0, 10);

    if (isPlayerPushQuietHours(now)) {
      await prisma.coachVideo.update({
        where: { id: params.coachVideoId },
        data: { notifyPending: true },
      });
      return;
    }

    const hasPush = await userHasPushSubscriptions(params.userId);
    if (hasPush) {
      await sendCoachVideoPush({
        userId: params.userId,
        coachVideoId: params.coachVideoId,
        title: params.title,
        dateKey,
      });
      return;
    }

    await sendCoachVideoEmail({
      userId: params.userId,
      toEmail: params.userEmail,
      coachVideoId: params.coachVideoId,
      title: params.title,
    });
  } catch (error) {
    console.error("Coach video notification failed", error);
  }
}

export async function processQueuedCoachVideoNotifications(now = new Date()) {
  const pending = await prisma.coachVideo.findMany({
    where: { notifyPending: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const dateKey = now.toISOString().slice(0, 10);

  for (const video of pending) {
    try {
      const hasPush = await userHasPushSubscriptions(video.user.id);

      if (hasPush) {
        await sendCoachVideoPush({
          userId: video.user.id,
          coachVideoId: video.id,
          title: video.title,
          dateKey,
        });
      } else {
        await sendCoachVideoEmail({
          userId: video.user.id,
          toEmail: video.user.email,
          coachVideoId: video.id,
          title: video.title,
        });
      }

      await prisma.coachVideo.update({
        where: { id: video.id },
        data: { notifyPending: false },
      });
    } catch (error) {
      console.error("Queued coach video notification failed", error);
    }
  }
}
