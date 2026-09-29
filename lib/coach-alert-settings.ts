import "server-only";

import type { CoachAlertSettingsState } from "@/lib/coach-push-shared";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function getAdminUsers() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return [];
  }

  const normalize = (value: string) => value.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
  const normalizedAdminEmail = normalize(adminEmail);

  const users = await prisma.user.findMany({
    where: {
      email: {
        equals: adminEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (users.length > 0) {
    return users;
  }

  const fallback = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return fallback.filter((user) => normalize(user.email) === normalizedAdminEmail);
}

export async function ensureCoachAlertSettings(userId: string) {
  return prisma.coachAlertSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export function serializeCoachAlertSettings(settings: {
  newVideosEnabled: boolean;
  newProgramPlayersEnabled: boolean;
  newMessagesEnabled: boolean;
  nightlySummaryPushEnabled: boolean;
  emailNightlySummaryEnabled: boolean;
}): CoachAlertSettingsState {
  return {
    newVideosEnabled: settings.newVideosEnabled,
    newProgramPlayersEnabled: settings.newProgramPlayersEnabled,
    newMessagesEnabled: settings.newMessagesEnabled,
    nightlySummaryPushEnabled: settings.nightlySummaryPushEnabled,
    emailNightlySummaryEnabled: settings.emailNightlySummaryEnabled,
  };
}

export async function getCoachAlertSettingsForAdminEmail(email?: string | null) {
  if (!isAdminEmail(email)) {
    return null;
  }

  const admins = await getAdminUsers();
  const admin = admins[0];
  if (!admin) {
    return null;
  }

  const settings = await ensureCoachAlertSettings(admin.id);
  return {
    userId: admin.id,
    settings: serializeCoachAlertSettings(settings),
  };
}

export async function getCoachAlertSettingsForUser(userId: string) {
  const settings = await ensureCoachAlertSettings(userId);
  return serializeCoachAlertSettings(settings);
}

export async function updateCoachAlertSettings(
  userId: string,
  data: Partial<CoachAlertSettingsState>,
) {
  const settings = await prisma.coachAlertSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });

  return serializeCoachAlertSettings(settings);
}

export async function getAdminUsersWithAlertSettings() {
  const admins = await getAdminUsers();
  return Promise.all(
    admins.map(async (admin) => ({
      ...admin,
      settings: serializeCoachAlertSettings(await ensureCoachAlertSettings(admin.id)),
    })),
  );
}

export async function isCoachEmailSummaryEnabled() {
  const admins = await getAdminUsersWithAlertSettings();
  if (admins.length === 0) {
    return true;
  }

  return admins.some((admin) => admin.settings.emailNightlySummaryEnabled);
}
