import "server-only";

import type { ProgramEnrollment, User } from "@prisma/client";
import {
  canMessageCoach,
  hasPersonalProgramDashboard,
  resolveEffectiveLevel,
  usesFixedTwelveWeekProgram,
  usesOpenEndedProgram,
  type AccessUserFields,
} from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
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
import { getProgramDay, PROGRAM_DAY_COUNT } from "@/lib/program-schedule";
import { defaultProgramPlanMode } from "@/lib/program-plan-mode-shared";
import { prisma } from "@/lib/prisma";

type EnrollmentWithUser = ProgramEnrollment & {
  user: Pick<User, "id" | "name" | "email" | "membershipTier" | "membershipLevel" | "membershipLevelExpiresAt" | "playbookLegacyAccess">;
};

export type MessagingAccessState =
  | "none"
  | "active"
  | "read_only";

function accessFromEnrollmentUser(user: EnrollmentWithUser["user"]): AccessUserFields {
  return toAccessUserFields(user);
}

export function getProgramMessagingAccessState(
  enrollment: EnrollmentWithUser | null,
  now = new Date(),
): MessagingAccessState {
  if (!enrollment) {
    return "none";
  }

  const access = accessFromEnrollmentUser(enrollment.user);
  if (!canMessageCoach(access, now)) {
    return "none";
  }

  const fixedTwelveWeek = usesFixedTwelveWeekProgram(access, now);
  const openEnded = usesOpenEndedProgram(access, now);

  if (!fixedTwelveWeek && !openEnded) {
    return "none";
  }

  if (enrollment.status !== "ACTIVE" || !enrollment.onboardingCompletedAt) {
    return "read_only";
  }

  const planMode = enrollment.planMode ?? defaultProgramPlanMode();
  const schedule = getProgramDay(
    { startDate: enrollment.startDate, planMode },
    now,
  );

  if (openEnded && planMode === "OPEN_ENDED") {
    return "active";
  }

  if (fixedTwelveWeek && (schedule.isComplete || schedule.programDay > PROGRAM_DAY_COUNT)) {
    return "read_only";
  }

  if (fixedTwelveWeek) {
    return "active";
  }

  return "read_only";
}

export function getPlusMessagingAccessState(
  access: AccessUserFields,
  now = new Date(),
): MessagingAccessState {
  if (hasPersonalProgramDashboard(access, now)) {
    return "none";
  }
  const effective = resolveEffectiveLevel(access, now);
  if (effective === "PLUS" && canMessageCoach(access, now)) {
    return "active";
  }
  if (effective === "LEGACY_MEMORABLE" || effective === "LEGACY_ELITE") {
    return "active";
  }
  return "none";
}

export function getMessagingAccessStateForUser(
  access: AccessUserFields,
  enrollment: EnrollmentWithUser | null,
  now = new Date(),
): MessagingAccessState {
  const plusState = getPlusMessagingAccessState(access, now);
  if (plusState === "active") {
    return "active";
  }

  return getProgramMessagingAccessState(enrollment, now);
}

/** @deprecated Use getMessagingAccessStateForUser with access + enrollment */
export function getMessagingAccessState(
  enrollment: EnrollmentWithUser | null,
  now = new Date(),
): MessagingAccessState {
  if (!enrollment) {
    return "none";
  }
  return getMessagingAccessStateForUser(accessFromEnrollmentUser(enrollment.user), enrollment, now);
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
          ...userAccessSelect,
        },
      },
      conversation: true,
    },
  });
}

export async function getOrCreateConversationForEnrollment(enrollmentId: string) {
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

export async function getOrCreateConversationForUser(userId: string) {
  const existing = await prisma.conversation.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: { userId },
  });
}

export async function resolvePlayerConversation(userId: string) {
  const enrollment = await getEnrollmentForUser(userId);
  const access = enrollment ? accessFromEnrollmentUser(enrollment.user) : await loadAccessFields(userId);

  if (!access) {
    return null;
  }

  const now = new Date();
  const plusState = getPlusMessagingAccessState(access, now);
  const onProgramMessaging =
    hasPersonalProgramDashboard(access, now) &&
    getProgramMessagingAccessState(enrollment, now) !== "none";

  if (plusState === "active" && !onProgramMessaging) {
    const conversation = await getOrCreateConversationForUser(userId);
    return {
      conversation,
      access: "active" as const,
      enrollment: null,
      accessUser: access,
    };
  }

  if (onProgramMessaging && enrollment) {
    const conversation =
      enrollment.conversation ?? (await getOrCreateConversationForEnrollment(enrollment.id));
    return {
      conversation,
      access: getMessagingAccessStateForUser(access, enrollment, now),
      enrollment,
      accessUser: access,
    };
  }

  if (plusState === "active") {
    const conversation = await getOrCreateConversationForUser(userId);
    return {
      conversation,
      access: "active" as const,
      enrollment: null,
      accessUser: access,
    };
  }

  return null;
}

async function loadAccessFields(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAccessSelect,
  });
  return user ? toAccessUserFields(user) : null;
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
  skipPlayerNotification?: boolean;
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

  if (params.fromCoach && !params.skipPlayerNotification) {
    void notifyPlayerOfCoachReply({
      conversationId: params.conversationId,
      userId: params.playerUserId,
      userEmail: params.playerEmail,
      body: message.body,
      messageId: message.id,
    });
  } else if (!params.fromCoach) {
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
  const resolved = await resolvePlayerConversation(userId);
  if (!resolved?.conversation) {
    return 0;
  }

  return resolved.conversation.playerUnreadCount;
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
    const playerUser = conversation.enrollment?.user ?? conversation.user;
    const schedule =
      conversation.enrollment?.startDate != null
        ? getProgramDay(
            {
              startDate: conversation.enrollment.startDate,
              planMode: conversation.enrollment.planMode,
            },
            new Date(),
          )
        : null;

    return {
      id: conversation.id,
      enrollmentId: conversation.enrollmentId,
      playerUserId: playerUser?.id ?? null,
      playerName: playerUser?.name ?? playerUser?.email ?? "Member",
      playerEmail: playerUser?.email ?? "",
      ageGroup: conversation.enrollment?.ageGroup ?? null,
      weekNumber: schedule?.weekNumber ?? null,
      isPlusDirect: Boolean(conversation.userId && !conversation.enrollmentId),
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
              membershipLevel: true,
              membershipLevelExpiresAt: true,
              playbookLegacyAccess: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          membershipTier: true,
          membershipLevel: true,
          membershipLevelExpiresAt: true,
          playbookLegacyAccess: true,
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
