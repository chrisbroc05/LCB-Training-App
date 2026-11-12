import "server-only";

import {
  GOAL_CHECKIN_REMINDER_PUSH_BODY,
  GOAL_CHECKIN_REMINDER_PUSH_HOUR_CHICAGO,
  GOAL_CHECKIN_REMINDER_PUSH_TITLE,
  GOAL_CHECKIN_REMINDER_URL,
} from "@/lib/goal-checkin-reminder-shared";
import { CHICAGO_TIME_ZONE } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import { buildPushDedupeKey, sendPushToUser, userHasPushSubscriptions } from "@/lib/push-send";

function readChicagoParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(lookup("year")),
    month: Number(lookup("month")),
    day: Number(lookup("day")),
    hour: Number(lookup("hour") === "24" ? "0" : lookup("hour")),
  };
}

export function shouldSendGoalCheckinReminderNow(now: Date): boolean {
  const parts = readChicagoParts(now);
  return parts.day === 1 && parts.hour === GOAL_CHECKIN_REMINDER_PUSH_HOUR_CHICAGO;
}

export function goalCheckinReminderMonthKey(now: Date): string {
  const parts = readChicagoParts(now);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

export async function runAllAccessGoalCheckinReminderPush(params: {
  dryRun: boolean;
  now: Date;
  dateKey: string;
  hour: number;
  previews: Array<{
    channel: "push";
    type: string;
    userId: string;
    title: string;
    body: string;
    url: string;
    dateKey: string;
  }>;
  trySend: (label: string, fn: () => Promise<boolean>) => Promise<void>;
}) {
  if (!shouldSendGoalCheckinReminderNow(params.now)) {
    return;
  }

  const monthKey = goalCheckinReminderMonthKey(params.now);
  const users = await prisma.user.findMany({
    where: {
      isTestAccount: false,
      membershipLevel: "ALL_ACCESS",
      OR: [{ membershipLevelExpiresAt: null }, { membershipLevelExpiresAt: { gt: params.now } }],
      pushSubscriptions: { some: {} },
    },
    select: { id: true },
  });

  for (const user of users) {
    await params.trySend(`push-goal-checkin-reminder:${user.id}:${monthKey}`, async () => {
      const hasPush = await userHasPushSubscriptions(user.id);
      if (!hasPush) {
        return false;
      }

      const type = "GOAL_CHECKIN_REMINDER" as const;
      const dedupeKey = buildPushDedupeKey(user.id, type, monthKey);
      const title = GOAL_CHECKIN_REMINDER_PUSH_TITLE;
      const body = GOAL_CHECKIN_REMINDER_PUSH_BODY;
      const url = GOAL_CHECKIN_REMINDER_URL;

      params.previews.push({
        channel: "push",
        type,
        userId: user.id,
        title,
        body,
        url,
        dateKey: params.dateKey,
      });

      if (!params.dryRun) {
        await sendPushToUser(user.id, { title, body, url }, { type, dedupeKey });
      }
      return true;
    });
  }
}
