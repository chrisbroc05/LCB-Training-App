import "server-only";

import webpush from "web-push";
import type { PushNotificationType } from "@prisma/client";
import { getPublicAppUrl } from "@/lib/email-layout";
import type { PushMessagePayload } from "@/lib/push-shared";
import { prisma } from "@/lib/prisma";

const MAX_FAILURE_COUNT = 5;

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:chrisbroc05@gmail.com";

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

export function isPushEnabled() {
  return Boolean(getVapidConfig());
}

function ensureWebPushConfigured() {
  const config = getVapidConfig();
  if (!config) {
    return null;
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return config;
}

export function buildPushDedupeKey(userId: string, type: PushNotificationType, dateKey: string) {
  return `${userId}:${type}:${dateKey}`;
}

export async function hasPushBeenSent(dedupeKey: string) {
  const existing = await prisma.pushLog.findUnique({
    where: { dedupeKey },
    select: { id: true, success: true },
  });
  return Boolean(existing?.success);
}

export async function userHasPushSubscriptions(userId: string) {
  const count = await prisma.pushSubscription.count({
    where: { userId },
  });
  return count > 0;
}

function normalizePushUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base = getPublicAppUrl();
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

async function recordPushLog(params: {
  userId: string;
  type: PushNotificationType;
  dedupeKey: string;
  success: boolean;
  error?: string | null;
  skipLog?: boolean;
}) {
  if (params.skipLog) {
    return;
  }

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

async function handlePushFailure(subscriptionId: string, statusCode: number | null) {
  if (statusCode === 404 || statusCode === 410) {
    await prisma.pushSubscription.delete({ where: { id: subscriptionId } });
    return;
  }

  const updated = await prisma.pushSubscription.update({
    where: { id: subscriptionId },
    data: { failureCount: { increment: 1 } },
    select: { failureCount: true },
  });

  if (updated.failureCount >= MAX_FAILURE_COUNT) {
    await prisma.pushSubscription.delete({ where: { id: subscriptionId } });
  }
}

export async function sendPushToUser(
  userId: string,
  message: PushMessagePayload,
  options?: {
    type?: PushNotificationType;
    dedupeKey?: string;
    skipLog?: boolean;
    skipDedupeCheck?: boolean;
  },
) {
  if (!ensureWebPushConfigured()) {
    return { sent: 0, skipped: true, reason: "push_not_configured" as const };
  }

  const type = options?.type ?? "TEST";
  const dateKey = new Date().toISOString().slice(0, 10);
  const dedupeKey = options?.dedupeKey ?? buildPushDedupeKey(userId, type, dateKey);

  if (!options?.skipDedupeCheck && !options?.skipLog) {
    const alreadySent = await hasPushBeenSent(dedupeKey);
    if (alreadySent) {
      return { sent: 0, skipped: true, reason: "already_sent" as const };
    }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, skipped: true, reason: "no_subscriptions" as const };
  }

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: normalizePushUrl(message.url),
    icon: "/pwa-192.png",
  });

  let sent = 0;
  let lastError: string | null = null;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
      );

      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: {
          lastSuccessAt: new Date(),
          failureCount: 0,
        },
      });
      sent += 1;
    } catch (error) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : null;
      lastError = error instanceof Error ? error.message : "Push send failed.";
      await handlePushFailure(subscription.id, statusCode);
    }
  }

  const success = sent > 0;
  await recordPushLog({
    userId,
    type,
    dedupeKey,
    success,
    error: success ? null : lastError,
    skipLog: options?.skipLog,
  });

  return {
    sent,
    skipped: !success,
    reason: success ? null : (lastError ?? "send_failed"),
  };
}

export async function sendPushToUserSafe(
  userId: string,
  message: PushMessagePayload,
  options?: {
    type?: PushNotificationType;
    dedupeKey?: string;
    skipLog?: boolean;
    skipDedupeCheck?: boolean;
  },
) {
  try {
    return await sendPushToUser(userId, message, options);
  } catch (error) {
    console.error("Push notification failed", error);
    return { sent: 0, skipped: true, reason: "error" as const };
  }
}
