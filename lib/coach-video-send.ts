import "server-only";

import { buildCoachVideoMessageBody } from "@/lib/coach-video-shared";
import { createCoachVideoRecord, type CreateCoachVideoInput } from "@/lib/coach-video-server";
import { notifyPlayerOfCoachVideo } from "@/lib/coach-video-notifications";
import {
  getOrCreateConversationForEnrollment,
  sendConversationMessage,
} from "@/lib/direct-messaging-server";
import { prisma } from "@/lib/prisma";

export async function sendCoachVideoToPlayer(params: {
  coachUserId: string;
  input: CreateCoachVideoInput;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.input.userId },
    select: {
      id: true,
      name: true,
      email: true,
      programEnrollment: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Player not found.");
  }

  const enrollmentId =
    params.input.enrollmentId ?? user.programEnrollment?.id ?? null;

  const coachVideo = await createCoachVideoRecord({
    ...params.input,
    enrollmentId,
  });

  if (enrollmentId) {
    const conversation = await getOrCreateConversationForEnrollment(enrollmentId);
    await sendConversationMessage({
      conversationId: conversation.id,
      senderUserId: params.coachUserId,
      fromCoach: true,
      body: buildCoachVideoMessageBody(coachVideo.title, coachVideo.id),
      playerUserId: user.id,
      playerName: user.name,
      playerEmail: user.email,
      skipPlayerNotification: true,
    });
  }

  void notifyPlayerOfCoachVideo({
    coachVideoId: coachVideo.id,
    userId: user.id,
    userEmail: user.email,
    title: coachVideo.title,
  });

  return coachVideo;
}
