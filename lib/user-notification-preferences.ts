import { prisma } from "@/lib/prisma";

export type UserNotificationPreferenceKey =
  | "notifySubmissionResponse"
  | "notifyGoalResponse"
  | "notifyWeeklyCheckin"
  | "notifyAnnouncements";

const preferenceSelect = {
  notifySubmissionResponse: true,
  notifyGoalResponse: true,
  notifyWeeklyCheckin: true,
  notifyAnnouncements: true,
} as const;

export async function getUserNotificationPreferences(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: preferenceSelect,
  });
}

export async function shouldSendNotificationEmail(
  userId: string,
  preference: UserNotificationPreferenceKey,
) {
  const user = await getUserNotificationPreferences(userId);
  if (!user) {
    return false;
  }

  return user[preference];
}
