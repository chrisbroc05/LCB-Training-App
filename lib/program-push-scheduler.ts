import "server-only";

import type { PushNotificationType } from "@prisma/client";
import { getTaskCategoryLabel } from "@/lib/program-email-task-label";
import { getChicagoDateTimeParts } from "@/lib/program-email-chicago";
import {
  enrollmentNeedsVideoReminder,
  getEnrollmentTasksForProgramDay,
  isDayBeforeStart,
  loadActiveEnrollments,
  type ActiveEnrollmentRecord,
} from "@/lib/program-email-data";
import { isGoneQuiet } from "@/lib/program-gone-quiet";
import {
  buildPushDedupeKey,
  sendPushToUser,
  userHasPushSubscriptions,
} from "@/lib/push-send";
import { getProgramDay } from "@/lib/program-schedule";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import { getTaskKeysForDay } from "@/lib/program-daily-plan";
import { buildProgramDayInfoForProgramDay, toEnrollmentPlanInput } from "@/lib/program-today-server";
import { prisma } from "@/lib/prisma";

export type ScheduledPushPreview = {
  channel: "push";
  type: PushNotificationType;
  userId: string;
  enrollmentId: string;
  title: string;
  body: string;
  url: string;
  dateKey: string;
};

async function enrollmentFinishedToday(enrollment: ActiveEnrollmentRecord, now: Date) {
  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const planInput = toEnrollmentPlanInput(enrollment);
  if (!planInput || schedule.programDay <= 0 || schedule.dayOfWeek === 7) {
    return false;
  }

  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);
  const dayInfo = buildProgramDayInfoForProgramDay(
    { startDate: enrollment.startDate },
    schedule.programDay,
  );
  const overrides = buildOverridesForWeekAndDay(
    overrideBundle,
    dayInfo.weekNumber,
    schedule.programDay,
  );
  const keys = getTaskKeysForDay(planInput, dayInfo, overrides);
  if (keys.length === 0) {
    return false;
  }

  const done = keys.filter((key) =>
    enrollment.taskCompletions.some(
      (completion) =>
        completion.programDay === schedule.programDay && completion.taskKey === key,
    ),
  ).length;

  return done === keys.length;
}

async function maybeSendDailyWorkPush(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledPushPreview[],
) {
  const hasPush = await userHasPushSubscriptions(enrollment.userId);
  if (!hasPush) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  if (
    schedule.isBeforeStart ||
    schedule.isComplete ||
    schedule.programDay <= 0 ||
    schedule.programDay > 84 ||
    schedule.dayOfWeek === 7
  ) {
    return false;
  }

  if (await enrollmentFinishedToday(enrollment, now)) {
    return false;
  }

  const type = "DAILY_WORK" as const;
  const dedupeKey = buildPushDedupeKey(enrollment.userId, type, dateKey);
  const tasks = await getEnrollmentTasksForProgramDay(enrollment, schedule.programDay);
  if (tasks.length === 0) {
    return false;
  }

  const firstTask = tasks[0];
  const firstLabel = `${getTaskCategoryLabel(firstTask.type)} - ${firstTask.title}`;
  const extraCount = tasks.length - 1;
  const body =
    extraCount > 0 ? `${firstLabel} and ${extraCount} more` : firstLabel;

  previews.push({
    channel: "push",
    type,
    userId: enrollment.userId,
    enrollmentId: enrollment.id,
    title: "Today's work is ready",
    body,
    url: "/dashboard/today",
    dateKey,
  });

  if (!dryRun) {
    await sendPushToUser(
      enrollment.userId,
      {
        title: "Today's work is ready",
        body,
        url: "/dashboard/today",
      },
      { type, dedupeKey },
    );
  }

  return true;
}

async function maybeSendDayBeforeStartPush(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  dryRun: boolean,
  previews: ScheduledPushPreview[],
) {
  const hasPush = await userHasPushSubscriptions(enrollment.userId);
  if (!hasPush || !isDayBeforeStart(enrollment, dateKey)) {
    return false;
  }

  const type = "DAY_BEFORE_START" as const;
  const dedupeKey = buildPushDedupeKey(enrollment.userId, type, dateKey);

  previews.push({
    channel: "push",
    type,
    userId: enrollment.userId,
    enrollmentId: enrollment.id,
    title: "Your program starts tomorrow",
    body: "Day 1 is tomorrow. Get some sleep.",
    url: "/dashboard/today",
    dateKey,
  });

  if (!dryRun) {
    await sendPushToUser(
      enrollment.userId,
      {
        title: "Your program starts tomorrow",
        body: "Day 1 is tomorrow. Get some sleep.",
        url: "/dashboard/today",
      },
      { type, dedupeKey },
    );
  }

  return true;
}

async function maybeSendSaturdayVideoPush(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledPushPreview[],
) {
  const hasPush = await userHasPushSubscriptions(enrollment.userId);
  if (!hasPush) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  if (schedule.isBeforeStart || schedule.isComplete || schedule.programDay <= 0) {
    return false;
  }

  if (!(await enrollmentNeedsVideoReminder(enrollment, now))) {
    return false;
  }

  const type = "SATURDAY_VIDEO" as const;
  const dedupeKey = buildPushDedupeKey(enrollment.userId, type, dateKey);

  previews.push({
    channel: "push",
    type,
    userId: enrollment.userId,
    enrollmentId: enrollment.id,
    title: "Your weekly video is due Sunday night",
    body: "Send me one video before Sunday night.",
    url: "/coaching-submissions",
    dateKey,
  });

  if (!dryRun) {
    await sendPushToUser(
      enrollment.userId,
      {
        title: "Your weekly video is due Sunday night",
        body: "Send me one video before Sunday night.",
        url: "/coaching-submissions",
      },
      { type, dedupeKey },
    );
  }

  return true;
}

async function shouldSendGoneQuietPush(userId: string) {
  const lastPush = await prisma.pushLog.findFirst({
    where: { userId, type: "GONE_QUIET", success: true },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });

  if (!lastPush) {
    return true;
  }

  const lastCompletion = await prisma.taskCompletion.findFirst({
    where: { enrollment: { userId } },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  if (!lastCompletion) {
    return false;
  }

  return lastCompletion.completedAt > lastPush.sentAt;
}

async function maybeSendGoneQuietPush(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledPushPreview[],
) {
  const hasPush = await userHasPushSubscriptions(enrollment.userId);
  if (!hasPush) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const completionDays = new Set(enrollment.taskCompletions.map((item) => item.programDay));
  if (!isGoneQuiet(schedule.programDay, completionDays)) {
    return false;
  }

  if (!(await shouldSendGoneQuietPush(enrollment.userId))) {
    return false;
  }

  const type = "GONE_QUIET" as const;
  const dedupeKey = buildPushDedupeKey(enrollment.userId, type, dateKey);

  previews.push({
    channel: "push",
    type,
    userId: enrollment.userId,
    enrollmentId: enrollment.id,
    title: "Haven't seen you in a few days",
    body: "Get one thing done today.",
    url: "/dashboard/today",
    dateKey,
  });

  if (!dryRun) {
    await sendPushToUser(
      enrollment.userId,
      {
        title: "Haven't seen you in a few days",
        body: "Get one thing done today.",
        url: "/dashboard/today",
      },
      { type, dedupeKey },
    );
  }

  return true;
}

export async function runScheduledPushJobs(params: {
  dryRun: boolean;
  now: Date;
  dateKey: string;
  hour: number;
  minute: number;
  isSaturday: boolean;
  previews: ScheduledPushPreview[];
  trySend: (label: string, fn: () => Promise<boolean>) => Promise<void>;
}) {
  const enrollments = await loadActiveEnrollments(params.now);

  if (params.hour === 7 && params.minute < 30) {
    for (const enrollment of enrollments) {
      await params.trySend(`push-day-before:${enrollment.id}`, () =>
        maybeSendDayBeforeStartPush(enrollment, params.dateKey, params.dryRun, params.previews),
      );
    }
  }

  if (params.hour === 15 && params.minute >= 30) {
    for (const enrollment of enrollments) {
      await params.trySend(`push-daily-work:${enrollment.id}`, () =>
        maybeSendDailyWorkPush(
          enrollment,
          params.dateKey,
          params.now,
          params.dryRun,
          params.previews,
        ),
      );
    }
  }

  if (params.hour === 10 && params.minute < 30 && params.isSaturday) {
    for (const enrollment of enrollments) {
      await params.trySend(`push-saturday-video:${enrollment.id}`, () =>
        maybeSendSaturdayVideoPush(
          enrollment,
          params.dateKey,
          params.now,
          params.dryRun,
          params.previews,
        ),
      );
    }
  }

  if (params.hour === 17 && params.minute < 30) {
    for (const enrollment of enrollments) {
      await params.trySend(`push-gone-quiet:${enrollment.id}`, () =>
        maybeSendGoneQuietPush(
          enrollment,
          params.dateKey,
          params.now,
          params.dryRun,
          params.previews,
        ),
      );
    }
  }
}

export { userHasPushSubscriptions };
