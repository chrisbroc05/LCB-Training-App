import "server-only";

import type { PushNotificationType } from "@prisma/client";
import {
  getAdminUsersWithAlertSettings,
} from "@/lib/coach-alert-settings";
import type { CoachAlertSettingsState } from "@/lib/coach-push-shared";
import type { PushMessagePayload } from "@/lib/push-shared";
import { hasPushBeenSent, isPushEnabled, sendPushToUser } from "@/lib/push-send";
import { prisma } from "@/lib/prisma";

type CoachAlertSettingKey =
  | "newVideosEnabled"
  | "newProgramPlayersEnabled"
  | "nightlySummaryPushEnabled";

async function recordCoachPushLog(params: {
  userId: string;
  type: PushNotificationType;
  dedupeKey: string;
  success: boolean;
  error?: string | null;
}) {
  await prisma.pushLog.create({
    data: {
      userId: params.userId,
      type: params.type,
      dedupeKey: params.dedupeKey,
      success: params.success,
      error: params.error ?? null,
    },
  });
}

export async function sendCoachAlertPush(params: {
  type: PushNotificationType;
  dedupeKey: string;
  message: PushMessagePayload;
  settingKey: CoachAlertSettingKey;
  skipDedupeCheck?: boolean;
}) {
  if (!isPushEnabled()) {
    return { sent: 0, skipped: true, reason: "push_not_configured" as const };
  }

  if (!params.skipDedupeCheck && (await hasPushBeenSent(params.dedupeKey))) {
    return { sent: 0, skipped: true, reason: "already_sent" as const };
  }

  const admins = await getAdminUsersWithAlertSettings();
  if (admins.length === 0) {
    return { sent: 0, skipped: true, reason: "no_admin_users" as const };
  }

  let sent = 0;
  let lastError: string | null = null;
  let logUserId = admins[0]?.id ?? "";

  for (const admin of admins) {
    if (!admin.settings[params.settingKey as keyof CoachAlertSettingsState]) {
      continue;
    }

    const result = await sendPushToUser(admin.id, params.message, {
      type: params.type,
      dedupeKey: params.dedupeKey,
      skipLog: true,
      skipDedupeCheck: true,
    });

    if (result.sent > 0) {
      sent += result.sent;
      logUserId = admin.id;
    } else if (typeof result.reason === "string") {
      lastError = result.reason;
    }
  }

  const success = sent > 0;

  if (logUserId) {
    try {
      await recordCoachPushLog({
        userId: logUserId,
        type: params.type,
        dedupeKey: params.dedupeKey,
        success,
        error: success ? null : lastError,
      });
    } catch (error) {
      console.error("Failed to record coach push log", error);
    }
  }

  return {
    sent,
    skipped: !success,
    reason: success ? null : (lastError ?? "no_subscriptions"),
  };
}

export async function sendCoachAlertPushSafe(params: {
  type: PushNotificationType;
  dedupeKey: string;
  message: PushMessagePayload;
  settingKey: CoachAlertSettingKey;
  skipDedupeCheck?: boolean;
}) {
  try {
    return await sendCoachAlertPush(params);
  } catch (error) {
    console.error("Coach alert push failed", error);
    return { sent: 0, skipped: true, reason: "error" as const };
  }
}
