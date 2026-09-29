import "server-only";

import type { ProgramEnrollment, User } from "@prisma/client";
import {
  PLAYER_MESSAGE_RATE_LIMIT,
  PLAYER_MESSAGE_RATE_LIMIT_MESSAGE,
  PLAYER_MESSAGE_RATE_WINDOW_MS,
  validateMessageBody,
} from "@/lib/direct-messaging-shared";
import {
  notifyCoachOfPlayerMessage,
  notifyPlayerOfCoachReply,
} from "@/lib/direct-messaging-notifications";
import { isTwelveWeekProgramMember } from "@/lib/membership";
import { getProgramDay } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

type EnrollmentWithUser = ProgramEnrollment & {
  user: Pick<User, "id" | "name" | "email" | "membershipTier">;
};

export type MessagingAccessState =
  | "none"
  | "active"
  | "read_only";

export function getMessagingAccessState(
  enrollment: EnrollmentWithUser | null,
  now = new Date(),
): MessagingAccessState {
  if (!enrollment || !isTwelveWeekProgramMember(enrollment.user.membershipTier)) {
    return "none";
  }

  if (enrollment.status !== "ACTIVE" || !enrollment.onboardingCompletedAt) {
    return "read_only";
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  if (schedule.isComplete || schedule.programDay > 84) {
    return "read_only";
  }

  return "active";
}

export async function getEnrollmentForUser(userId: string) {
  return prisma.programEnrollment.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          membershipTier: true,
        },
      },
      conversation: true,
    },
  });
}

export async function getOrCreateConversation(enrollmentId: string) {
  const existing = await prisma.conversation.findUnique({
    where: { enrollmentId },
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: { enrollmentId },
  });
}

export async function getOrCreateConversationForEnrollment(enrollmentId: string) {
  return getOrCreateConversation(enrollmentId);
}

async function assertPlayerRateLimit(userId: string) {
  const since = new Date(Date.now() - PLAYER_MESSAGE_RATE_WINDOW_MS);
  const count = await prisma.message.count({
    where: {
      senderUserId: userId,
      fromCoach: false,
      createdAt: { gte: since },
    },
  });

  if (count >= PLAYER_MESSAGE_RATE_LIMIT) {
    throw new Error(PLAYER_MESSAGE_RATE_LIMIT_MESSAGE);
  }
}

export async function listConversationMessages(conversationId: string, limit = 200) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      body: true,
      fromCoach: true,
      createdAt: true,
      readAt: true,
      senderUserId: true,
    },
  });
}

export async function markConversationRead(params: {
  conversationId: string;
  forCoach: boolean;
}) {
  const now = new Date();

  if (params.forCoach) {
    await prisma.message.updateMany({
      where: {
        conversationId: params.conversationId,
        fromCoach: false,
        readAt: null,
      },
      data: { readAt: now },
    });

    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: { coachUnreadCount: 0 },
    });
    return;
  }

  await prisma.message.updateMany({
    where: {
      conversationId: params.conversationId,
      fromCoach: true,
      readAt: null,
    },
    data: { readAt: now },
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { playerUnreadCount: 0 },
  });
}

export async function sendConversationMessage(params: {
  conversationId: string;
  senderUserId: string;
  fromCoach: boolean;
  body: string;
  playerUserId: string;
  playerName: string | null;
  playerEmail: string;
}) {
  const validated = validateMessageBody(params.body);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  if (!params.fromCoach) {
    await assertPlayerRateLimit(params.senderUserId);
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: params.conversationId,
        senderUserId: params.senderUserId,
        fromCoach: params.fromCoach,
        body: validated.body,
      },
    });

    await tx.conversation.update({
      where: { id: params.conversationId },
      data: {
        lastMessageAt: created.createdAt,
        coachUnreadCount: params.fromCoach
          ? undefined
          : { increment: 1 },
        playerUnreadCount: params.fromCoach
          ? { increment: 1 }
          : undefined,
      },
    });

    return created;
  });

  if (params.fromCoach) {
    void notifyPlayerOfCoachReply({
      conversationId: params.conversationId,
      userId: params.playerUserId,
      userEmail: params.playerEmail,
      body: message.body,
      messageId: message.id,
    });
  } else {
    void notifyCoachOfPlayerMessage({
      conversationId: params.conversationId,
      playerUserId: params.playerUserId,
      playerName: params.playerName,
      playerEmail: params.playerEmail,
      body: message.body,
    });
  }

  return message;
}

export async function getPlayerUnreadCount(userId: string) {
  const enrollment = await getEnrollmentForUser(userId);
  if (!enrollment?.conversation) {
    return 0;
  }

  return enrollment.conversation.playerUnreadCount;
}

export async function getCoachUnreadCount() {
  const result = await prisma.conversation.aggregate({
    _sum: { coachUnreadCount: true },
  });

  return result._sum.coachUnreadCount ?? 0;
}

export async function listCoachInbox() {
  const conversations = await prisma.conversation.findMany({
    include: {
      enrollment: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          body: true,
          fromCoach: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ coachUnreadCount: "desc" }, { lastMessageAt: "desc" }],
  });

  return conversations.map((conversation) => {
    const lastMessage = conversation.messages[0] ?? null;
    const schedule = getProgramDay(
      { startDate: conversation.enrollment.startDate },
      new Date(),
    );

    return {
      id: conversation.id,
      enrollmentId: conversation.enrollmentId,
      playerName: conversation.enrollment.user.name ?? conversation.enrollment.user.email,
      playerEmail: conversation.enrollment.user.email,
      ageGroup: conversation.enrollment.ageGroup,
      weekNumber: schedule.weekNumber,
      coachUnreadCount: conversation.coachUnreadCount,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      lastMessagePreview: lastMessage?.body ?? null,
      lastMessageFromCoach: lastMessage?.fromCoach ?? false,
    };
  });
}

export async function getConversationById(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      enrollment: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              membershipTier: true,
            },
          },
        },
      },
    },
  });
}

export async function countMessagesInWeek(conversationId: string, weekStart: Date, weekEnd: Date) {
  return prisma.message.count({
    where: {
      conversationId,
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });
}

export async function countCoachUnreadMessages() {
  return prisma.message.count({
    where: {
      fromCoach: false,
      readAt: null,
    },
  });
}
