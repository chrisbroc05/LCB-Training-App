import { prisma } from "@/lib/prisma";

type CreateAppNotificationInput = {
  userId: string;
  title: string;
  body?: string | null;
  type: string;
  linkUrl?: string | null;
};

export async function createAppNotification(input: CreateAppNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body ?? null,
      type: input.type,
      linkUrl: input.linkUrl ?? null,
    },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}
