import "server-only";

import type { PushNotificationType } from "@prisma/client";
import {
  buildDailyWorkPushBody,
  buildGoneQuietPushBody,
  DAILY_WORK_PUSH_TITLE,
  GONE_QUIET_PUSH_TITLE,
  SETUP_REMINDER_PUSH_BODY,
  SETUP_REMINDER_PUSH_TITLE,
  shouldSkipDailyWorkPushForGoneQuiet,
} from "@/lib/program-push-copy";
import {
  isInSendWindow,
  isScheduleWindowActiveForDay,
  PROGRAM_SCHEDULE_WINDOWS,
} from "@/lib/program-schedule-windows";
import {
  enrollmentNeedsVideoReminder,
  getEnrollmentTasksForProgramDay,
  hasSetupReminderBeenSent,
  isDayBeforeStart,
  isSetupReminderDue,
  loadActiveEnrollments,
  loadSetupIncompleteEnrollments,
  type ActiveEnrollmentRecord,
} from "@/lib/program-email-data";
import { isGoneQuiet } from "@/lib/program-gone-quiet";
import {
  buildPushDedupeKey,
  sendPushToUser,
  userHasPushSubscriptions,
} from "@/lib/push-send";
import { getProgramDay, PROGRAM_DAY_COUNT } from "@/lib/program-schedule";
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

async function willSendGoneQuietPush(enrollment: ActiveEnrollmentRecord, now: Date) {
  const hasPush = await userHasPushSubscriptions(enrollment.userId);
  if (!hasPush) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const completionDays = new Set(enrollment.taskCompletions.map((item) => item.programDay));
  if (
    !enrollment.startDate ||
    !isGoneQuiet(enrollment.startDate, schedule.programDay, completionDays)
  ) {
    return false;
  }

  return shouldSendGoneQuietPush(enrollment.userId);
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
    schedule.programDay > PROGRAM_DAY_COUNT ||
    schedule.dayOfWeek === 7
  ) {
    return false;
  }

  if (await enrollmentFinishedToday(enrollment, now)) {
    return false;
  }

  if (shouldSkipDailyWorkPushForGoneQuiet(await willSendGoneQuietPush(enrollment, now))) {
    return false;
  }

  const type = "DAILY_WORK" as const;
  const dedupeKey = buildPushDedupeKey(enrollment.userId, type, dateKey);
  const tasks = await getEnrollmentTasksForProgramDay(enrollment, schedule.programDay);
  if (tasks.length === 0) {
    return false;
  }

  const includeWeeklyVideo = await enrollmentNeedsVideoReminder(enrollment, now);
  const body = buildDailyWorkPushBody({ tasks, includeWeeklyVideo });

  previews.push({
    channel: "push",
    type,
    userId: enrollment.userId,
    enrollmentId: enrollment.id,
    title: DAILY_WORK_PUSH_TITLE,
    body,
    url: "/dashboard/today",
    dateKey,
  });

  if (!dryRun) {
    await sendPushToUser(
      enrollment.userId,
      {
        title: DAILY_WORK_PUSH_TITLE,
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

type SetupIncompleteEnrollment = Awaited<
  ReturnType<typeof loadSetupIncompleteEnrollments>
>[number];

const SETUP_REMINDER_DATE_KEY = "once";

async function maybeSendSetupReminderPush(
  enrollment: SetupIncompleteEnrollment,
  dryRun: boolean,
  now: Date,
  previews: ScheduledPushPreview[],
) {
  const hasPush = await userHasPushSubscriptions(enrollment.userId);
  if (!hasPush) {
    return false;
  }

  if (enrollment.onboardingCompletedAt) {
    return false;
  }

  if (!isSetupReminderDue(enrollment.createdAt, now)) {
    return false;
  }

  if (await hasSetupReminderBeenSent(enrollment.id, enrollment.userId)) {
    return false;
  }

  const type = "SETUP_REMINDER" as const;
  const dedupeKey = buildPushDedupeKey(enrollment.userId, type, SETUP_REMINDER_DATE_KEY);

  previews.push({
    channel: "push",
    type,
    userId: enrollment.userId,
    enrollmentId: enrollment.id,
    title: SETUP_REMINDER_PUSH_TITLE,
    body: SETUP_REMINDER_PUSH_BODY,
    url: "/program/start",
    dateKey: SETUP_REMINDER_DATE_KEY,
  });

  if (!dryRun) {
    await sendPushToUser(
      enrollment.userId,
      {
        title: SETUP_REMINDER_PUSH_TITLE,
        body: SETUP_REMINDER_PUSH_BODY,
        url: "/program/start",
      },
      { type, dedupeKey },
    );
  }

  return true;
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
  if (
    !enrollment.startDate ||
    !isGoneQuiet(enrollment.startDate, schedule.programDay, completionDays)
  ) {
    return false;
  }

  if (!(await shouldSendGoneQuietPush(enrollment.userId))) {
    return false;
  }

  const type = "GONE_QUIET" as const;
  const dedupeKey = buildPushDedupeKey(enrollment.userId, type, dateKey);
  const tasks = await getEnrollmentTasksForProgramDay(enrollment, schedule.programDay);
  const includeWeeklyVideo = await enrollmentNeedsVideoReminder(enrollment, now);
  const body = buildGoneQuietPushBody({ tasks, includeWeeklyVideo });

  previews.push({
    channel: "push",
    type,
    userId: enrollment.userId,
    enrollmentId: enrollment.id,
    title: GONE_QUIET_PUSH_TITLE,
    body,
    url: "/dashboard/today",
    dateKey,
  });

  if (!dryRun) {
    await sendPushToUser(
      enrollment.userId,
      {
        title: GONE_QUIET_PUSH_TITLE,
        body,
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
  isSaturday: boolean;
  isSunday: boolean;
  previews: ScheduledPushPreview[];
  trySend: (label: string, fn: () => Promise<boolean>) => Promise<void>;
}) {
  const enrollments = await loadActiveEnrollments(params.now);
  const day = { isSaturday: params.isSaturday, isSunday: params.isSunday };
  const morningSevenWindow = PROGRAM_SCHEDULE_WINDOWS.find((window) => window.id === "morning-seven");
  const dailyWorkWindow = PROGRAM_SCHEDULE_WINDOWS.find((window) => window.id === "daily-work");
  const saturdayVideoWindow = PROGRAM_SCHEDULE_WINDOWS.find((window) => window.id === "saturday-video");
  const goneQuietWindow = PROGRAM_SCHEDULE_WINDOWS.find((window) => window.id === "gone-quiet");

  if (
    morningSevenWindow &&
    isInSendWindow(params.hour, morningSevenWindow.startHour, morningSevenWindow.endHour)
  ) {
    for (const enrollment of enrollments) {
      await params.trySend(`push-day-before:${enrollment.id}`, () =>
        maybeSendDayBeforeStartPush(enrollment, params.dateKey, params.dryRun, params.previews),
      );
    }

    const setupIncompleteEnrollments = await loadSetupIncompleteEnrollments();
    for (const enrollment of setupIncompleteEnrollments) {
      await params.trySend(`push-setup-reminder:${enrollment.id}`, () =>
        maybeSendSetupReminderPush(
          enrollment,
          params.dryRun,
          params.now,
          params.previews,
        ),
      );
    }
  }

  if (
    dailyWorkWindow &&
    isInSendWindow(params.hour, dailyWorkWindow.startHour, dailyWorkWindow.endHour)
  ) {
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

  if (
    saturdayVideoWindow &&
    isInSendWindow(params.hour, saturdayVideoWindow.startHour, saturdayVideoWindow.endHour) &&
    isScheduleWindowActiveForDay(saturdayVideoWindow, day)
  ) {
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

  if (
    goneQuietWindow &&
    isInSendWindow(params.hour, goneQuietWindow.startHour, goneQuietWindow.endHour)
  ) {
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
