import "server-only";

import type { ProgramEmailType } from "@prisma/client";
import { getChicagoDateTimeParts } from "@/lib/program-email-chicago";
import {
  buildCoachDailySummaryData,
  buildWeeklyRecapData,
  enrollmentNeedsVideoReminder,
  getEnrollmentCoachWeekBox,
  getEnrollmentTasksForProgramDay,
  getRecapWeekNumber,
  isDayBeforeStart,
  hasSetupReminderBeenSent,
  isSetupReminderDue,
  isProgramStillBeforeFirstWorkDay,
  loadActiveEnrollments,
  loadSetupIncompleteEnrollments,
  resolveEnrollmentParentEmail,
  shouldSendGoneQuietEmail,
  type ActiveEnrollmentRecord,
} from "@/lib/program-email-data";
import {
  hasProgramEmailBeenSent,
  logProgramEmailSent,
  sendProgramEmail,
} from "@/lib/program-email-send";
import {
  buildCoachDailySummaryEmail,
  buildDailyRoutineEmail,
  buildDayBeforeStartEmail,
  buildGoneQuietEmail,
  buildParentGoneQuietEmail,
  buildParentSaturdayVideoEmail,
  buildParentWeeklyRecapEmail,
  buildSaturdayVideoReminderEmail,
  buildSetupReminderEmail,
  getPlayerFirstName,
} from "@/lib/program-email-templates";
import {
  formatParentGoneQuietRecapNote,
  getGoneQuietSilence,
  isGoneQuiet,
} from "@/lib/program-gone-quiet";
import { buildParentUnsubscribeUrl } from "@/lib/program-parent-token";
import { computeProgramStreak } from "@/lib/program-streak-shared";
import {
  getChicagoDaysSinceDate,
  getProgramDay,
  PROGRAM_DAY_COUNT,
} from "@/lib/program-schedule";
import { getProgramStaleSetupReminderMaxDays } from "@/lib/program-cron-stale-shared";
import {
  buildProgramDayInfoForProgramDay,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import { getTaskKeysForDay } from "@/lib/program-daily-plan";
import { isCoachEmailSummaryEnabled } from "@/lib/coach-alert-settings";
import {
  loadParentConsentReminderPreviews,
  sendDueParentConsentReminders,
  type ParentConsentReminderPreview,
} from "@/lib/legal-server";
import {
  maybeSendCoachNightlySummaryPush,
  type ScheduledCoachPushPreview,
} from "@/lib/coach-push-scheduler";
import {
  buildProgramQueuedNotificationPreviews,
  processProgramQueuedNotificationsAfterStalePass,
  skipStaleProgramQueuedNotifications,
  type ProgramQueuedNotificationPreview,
} from "@/lib/program-queue-notifications-server";
import { isMorningPlayerPushWindow } from "@/lib/direct-messaging-quiet-hours";
import {
  getActiveScheduleWindows,
  isInSendWindow,
  isScheduleWindowActiveForDay,
  PROGRAM_SCHEDULE_WINDOWS,
} from "@/lib/program-schedule-windows";
import {
  runScheduledPushJobs,
  userHasPushSubscriptions,
  type ScheduledPushPreview,
} from "@/lib/program-push-scheduler";

const COACH_EMAIL = "chrisbroc05@gmail.com";

export type ScheduledEmailPreview = {
  type: ProgramEmailType;
  recipient: "player" | "parent" | "coach";
  enrollmentId: string | null;
  to: string;
  subject: string;
  dateKey: string;
  staleReason?: string;
};

export type ProgramEmailRunResult = {
  dateKey: string;
  hour: number;
  activeWindows: string[];
  /** Present in dry run: effective instant used for Chicago schedule (from ?at or server clock). */
  simulatedAt?: string;
  /** True when dry run used a valid ?at= value */
  atQueryApplied?: boolean;
  dryRun: boolean;
  previews: ScheduledEmailPreview[];
  pushPreviews: ScheduledPushPreview[];
  coachPushPreviews: ScheduledCoachPushPreview[];
  parentConsentReminderPreviews: ParentConsentReminderPreview[];
  staleQueueSkipSummary: {
    coachReplySkipped: number;
    coachVideoSkipped: number;
    taskFeedbackSkipped: number;
  } | null;
  queuedNotificationPreviews: ProgramQueuedNotificationPreview[];
  sent: number;
  skipped: number;
  errors: string[];
};

async function getStreakForEnrollment(enrollment: ActiveEnrollmentRecord, now: Date) {
  if (!enrollment.startDate) {
    return 0;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);
  const planInput = toEnrollmentPlanInput(enrollment);
  const completedWorkDays = new Set<number>();

  if (planInput) {
    for (let day = 1; day <= Math.min(schedule.programDay, PROGRAM_DAY_COUNT); day += 1) {
      const dayInfo = buildProgramDayInfoForProgramDay({ startDate: enrollment.startDate }, day);
      const overrides = buildOverridesForWeekAndDay(overrideBundle, dayInfo.weekNumber, day);
      const expectedKeys = getTaskKeysForDay(planInput, dayInfo, overrides);
      if (expectedKeys.length === 0) {
        continue;
      }
      const doneCount = expectedKeys.filter((key) =>
        enrollment.taskCompletions.some((item) => item.programDay === day && item.taskKey === key),
      ).length;
      if (doneCount === expectedKeys.length) {
        completedWorkDays.add(day);
      }
    }
  }

  return computeProgramStreak({
    startDate: enrollment.startDate,
    currentProgramDay: schedule.programDay,
    completedWorkDays,
  });
}

async function maybeSendDailyRoutine(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  if (await userHasPushSubscriptions(enrollment.userId)) {
    return false;
  }

  if (!enrollment.dailyRoutineEmailsEnabled) {
    return false;
  }

  if (!enrollment.startDate) {
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

  const type = "DAILY_ROUTINE" as const;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey,
    })
  ) {
    return false;
  }

  const firstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
  const tasks = await getEnrollmentTasksForProgramDay(enrollment, schedule.programDay);
  const dayInfo = buildProgramDayInfoForProgramDay(
    { startDate: enrollment.startDate },
    schedule.programDay,
  );
  const coachWeekBox = await getEnrollmentCoachWeekBox(enrollment, dayInfo);
  const streak = await getStreakForEnrollment(enrollment, now);

  const email = buildDailyRoutineEmail({
    firstName,
    weekNumber: schedule.weekNumber,
    programDay: schedule.programDay,
    startDate: enrollment.startDate,
    tasks,
    streak,
    knownFor: enrollment.knownFor,
    coachWeekBox,
  });

  previews.push({
    type,
    recipient: "player",
    enrollmentId: enrollment.id,
    to: enrollment.user.email,
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: enrollment.user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey,
    });
  }

  return true;
}

async function maybeSendDayBeforeStart(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  if (await userHasPushSubscriptions(enrollment.userId)) {
    return false;
  }

  if (!isDayBeforeStart(enrollment, dateKey)) {
    return false;
  }

  if (!isProgramStillBeforeFirstWorkDay(enrollment, now)) {
    if (dryRun) {
      const firstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
      const email = buildDayBeforeStartEmail({
        firstName,
        knownFor: enrollment.knownFor,
      });
      previews.push({
        type: "DAY_BEFORE_START",
        recipient: "player",
        enrollmentId: enrollment.id,
        to: enrollment.user.email,
        subject: email.subject,
        dateKey,
        staleReason: "would skip (stale): program already started",
      });
    }
    return false;
  }

  const type = "DAY_BEFORE_START" as const;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey,
    })
  ) {
    return false;
  }

  const firstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
  const email = buildDayBeforeStartEmail({
    firstName,
    knownFor: enrollment.knownFor,
  });

  previews.push({
    type,
    recipient: "player",
    enrollmentId: enrollment.id,
    to: enrollment.user.email,
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: enrollment.user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey,
    });
  }

  return true;
}

async function maybeSendSaturdayVideoReminder(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  if (await userHasPushSubscriptions(enrollment.userId)) {
    return false;
  }

  if (!enrollment.dailyRoutineEmailsEnabled) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  if (schedule.isBeforeStart || schedule.isComplete || schedule.programDay <= 0) {
    return false;
  }

  if (!(await enrollmentNeedsVideoReminder(enrollment, now))) {
    return false;
  }

  const type = "SATURDAY_VIDEO_REMINDER" as const;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey,
    })
  ) {
    return false;
  }

  const firstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
  const email = buildSaturdayVideoReminderEmail({ firstName });

  previews.push({
    type,
    recipient: "player",
    enrollmentId: enrollment.id,
    to: enrollment.user.email,
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: enrollment.user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey,
    });
  }

  return true;
}

type SetupIncompleteEnrollment = Awaited<
  ReturnType<typeof loadSetupIncompleteEnrollments>
>[number];

const SETUP_REMINDER_DATE_KEY = "once";

async function maybeSendSetupReminder(
  enrollment: SetupIncompleteEnrollment,
  dryRun: boolean,
  now: Date,
  previews: ScheduledEmailPreview[],
) {
  if (enrollment.onboardingCompletedAt) {
    return false;
  }

  if (!isSetupReminderDue(enrollment.createdAt, now)) {
    return false;
  }

  const daysSinceSignup = getChicagoDaysSinceDate(enrollment.createdAt, now);
  if (daysSinceSignup > getProgramStaleSetupReminderMaxDays()) {
    if (dryRun) {
      const firstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
      const email = buildSetupReminderEmail({ firstName });
      previews.push({
        type: "SETUP_REMINDER",
        recipient: "player",
        enrollmentId: enrollment.id,
        to: enrollment.user.email,
        subject: email.subject,
        dateKey: SETUP_REMINDER_DATE_KEY,
        staleReason: `would skip (stale): setup reminder ${daysSinceSignup} days after signup`,
      });
    }
    return false;
  }

  if (await hasSetupReminderBeenSent(enrollment.id, enrollment.userId)) {
    return false;
  }

  if (await userHasPushSubscriptions(enrollment.userId)) {
    return false;
  }

  const type = "SETUP_REMINDER" as const;
  const firstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
  const email = buildSetupReminderEmail({ firstName });

  previews.push({
    type,
    recipient: "player",
    enrollmentId: enrollment.id,
    to: enrollment.user.email,
    subject: email.subject,
    dateKey: SETUP_REMINDER_DATE_KEY,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: enrollment.user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey: SETUP_REMINDER_DATE_KEY,
    });
  }

  return true;
}

async function maybeSendGoneQuiet(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  if (await userHasPushSubscriptions(enrollment.userId)) {
    return false;
  }

  if (!enrollment.dailyRoutineEmailsEnabled) {
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

  const type = "GONE_QUIET" as const;
  if (
    !(await shouldSendGoneQuietEmail({ enrollmentId: enrollment.id, type })) ||
    (await hasProgramEmailBeenSent({
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey,
    }))
  ) {
    return false;
  }

  const firstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
  const silence = getGoneQuietSilence(enrollment.taskCompletions, now);
  const email = buildGoneQuietEmail({ firstName, silence });

  previews.push({
    type,
    recipient: "player",
    enrollmentId: enrollment.id,
    to: enrollment.user.email,
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: enrollment.user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: enrollment.id,
      recipient: "player",
      type,
      dateKey,
    });
  }

  return true;
}

function parentWouldGetWeeklyRecapTonight(
  enrollment: ActiveEnrollmentRecord,
  now: Date,
  isSunday: boolean,
) {
  if (!isSunday || !resolveEnrollmentParentEmail(enrollment)) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const recapWeekNumber = getRecapWeekNumber(schedule);
  return Boolean(recapWeekNumber && recapWeekNumber >= 1);
}

async function maybeSendParentSaturdayVideo(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  const parentTo = resolveEnrollmentParentEmail(enrollment);
  if (!parentTo) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  if (schedule.isBeforeStart || schedule.isComplete || schedule.programDay <= 0) {
    return false;
  }

  if (!(await enrollmentNeedsVideoReminder(enrollment, now))) {
    return false;
  }

  const type = "PARENT_SATURDAY_VIDEO" as const;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: enrollment.id,
      recipient: "parent",
      type,
      dateKey,
    })
  ) {
    return false;
  }

  const playerFirstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
  const email = buildParentSaturdayVideoEmail({
    playerFirstName,
    unsubscribeUrl: buildParentUnsubscribeUrl(enrollment.id),
  });

  previews.push({
    type,
    recipient: "parent",
    enrollmentId: enrollment.id,
    to: parentTo,
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: parentTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: enrollment.id,
      recipient: "parent",
      type,
      dateKey,
    });
  }

  return true;
}

async function maybeSendParentGoneQuiet(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
  isSunday: boolean,
) {
  const parentTo = resolveEnrollmentParentEmail(enrollment);
  if (!parentTo) {
    return false;
  }

  // Sunday evening also sends weekly recap -- fold gone-quiet into that email instead.
  if (parentWouldGetWeeklyRecapTonight(enrollment, now, isSunday)) {
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

  const type = "PARENT_GONE_QUIET" as const;
  if (
    !(await shouldSendGoneQuietEmail({ enrollmentId: enrollment.id, type })) ||
    (await hasProgramEmailBeenSent({
      enrollmentId: enrollment.id,
      recipient: "parent",
      type,
      dateKey,
    }))
  ) {
    return false;
  }

  const tasks = await getEnrollmentTasksForProgramDay(enrollment, schedule.programDay);
  const playerFirstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
  const silence = getGoneQuietSilence(enrollment.taskCompletions, now);
  const email = buildParentGoneQuietEmail({
    playerFirstName,
    silence,
    tasks: tasks.map((task) => ({ title: task.title, target: task.target })),
    unsubscribeUrl: buildParentUnsubscribeUrl(enrollment.id),
  });

  previews.push({
    type,
    recipient: "parent",
    enrollmentId: enrollment.id,
    to: parentTo,
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: parentTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: enrollment.id,
      recipient: "parent",
      type,
      dateKey,
    });
  }

  return true;
}

async function maybeSendParentWeeklyRecap(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  const parentTo = resolveEnrollmentParentEmail(enrollment);
  if (!parentTo) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const recapWeekNumber = getRecapWeekNumber(schedule);
  if (!recapWeekNumber || recapWeekNumber < 1) {
    return false;
  }

  const type = "PARENT_WEEKLY_RECAP" as const;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: enrollment.id,
      recipient: "parent",
      type,
      dateKey,
    })
  ) {
    return false;
  }

  const recapData = await buildWeeklyRecapData(enrollment, recapWeekNumber);
  if (!recapData) {
    return false;
  }

  const completionDays = new Set(enrollment.taskCompletions.map((item) => item.programDay));
  const includeGoneQuiet =
    Boolean(enrollment.startDate) &&
    isGoneQuiet(enrollment.startDate!, schedule.programDay, completionDays) &&
    (await shouldSendGoneQuietEmail({
      enrollmentId: enrollment.id,
      type: "PARENT_GONE_QUIET",
    }));
  const silence = includeGoneQuiet
    ? getGoneQuietSilence(enrollment.taskCompletions, now)
    : null;
  const goneQuietNote = silence
    ? formatParentGoneQuietRecapNote(recapData.playerFirstName, silence)
    : null;

  const email = buildParentWeeklyRecapEmail({
    ...recapData,
    goneQuietNote,
  });

  previews.push({
    type,
    recipient: "parent",
    enrollmentId: enrollment.id,
    to: parentTo,
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: parentTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: enrollment.id,
      recipient: "parent",
      type,
      dateKey,
    });

    // Mark gone-quiet handled so standalone PARENT_GONE_QUIET does not also fire
    // until the player logs work again (same cadence as a standalone send).
    if (
      includeGoneQuiet &&
      !(await hasProgramEmailBeenSent({
        enrollmentId: enrollment.id,
        recipient: "parent",
        type: "PARENT_GONE_QUIET",
        dateKey,
      }))
    ) {
      await logProgramEmailSent({
        enrollmentId: enrollment.id,
        recipient: "parent",
        type: "PARENT_GONE_QUIET",
        dateKey,
      });
    }
  }

  return true;
}

async function maybeSendCoachDailySummary(
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  const summaryData = await buildCoachDailySummaryData(dateKey, now);
  if (!summaryData) {
    return false;
  }

  if (!(await isCoachEmailSummaryEnabled())) {
    return false;
  }

  const type = "COACH_DAILY_SUMMARY" as const;
  if (
    await hasProgramEmailBeenSent({
      enrollmentId: null,
      recipient: "coach",
      type,
      dateKey,
    })
  ) {
    return false;
  }

  const { anyAdminCoachSignupAlertMode } = await import("@/lib/coach-alert-settings");
  const includeSignupDailySection = await anyAdminCoachSignupAlertMode("DAILY");
  const email = buildCoachDailySummaryEmail({
    ...summaryData,
    includeSignupDailySection,
  });

  previews.push({
    type,
    recipient: "coach",
    enrollmentId: null,
    to: COACH_EMAIL,
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: COACH_EMAIL,
      subject: email.subject,
      html: email.html,
      text: email.text,
      enrollmentId: null,
      recipient: "coach",
      type,
      dateKey,
    });
  }

  return true;
}

export async function runProgramEmailScheduler(params?: {
  dryRun?: boolean;
  now?: Date;
  atQueryApplied?: boolean;
}): Promise<ProgramEmailRunResult> {
  const dryRun = params?.dryRun ?? false;
  const now = params?.now ?? new Date();
  const atQueryApplied = params?.atQueryApplied ?? false;
  const { dateKey, hour, isSaturday, isSunday } = getChicagoDateTimeParts(now);
  const day = { isSaturday, isSunday };
  const activeWindows = getActiveScheduleWindows(hour, day).map((window) => window.id);
  const previews: ScheduledEmailPreview[] = [];
  const pushPreviews: ScheduledPushPreview[] = [];
  const coachPushPreviews: ScheduledCoachPushPreview[] = [];
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;
  let parentConsentReminderPreviews: ParentConsentReminderPreview[] = [];
  let staleQueueSkipSummary: ProgramEmailRunResult["staleQueueSkipSummary"] = null;
  let queuedNotificationPreviews: ProgramQueuedNotificationPreview[] = [];

  const enrollments = await loadActiveEnrollments(now);
  const morningSevenWindow = PROGRAM_SCHEDULE_WINDOWS.find((window) => window.id === "morning-seven");
  const saturdayVideoWindow = PROGRAM_SCHEDULE_WINDOWS.find((window) => window.id === "saturday-video");
  const goneQuietWindow = PROGRAM_SCHEDULE_WINDOWS.find((window) => window.id === "gone-quiet");
  const parentWeeklyRecapWindow = PROGRAM_SCHEDULE_WINDOWS.find(
    (window) => window.id === "parent-weekly-recap",
  );
  const coachNightlyWindow = PROGRAM_SCHEDULE_WINDOWS.find((window) => window.id === "coach-nightly");

  const trySend = async (label: string, fn: () => Promise<boolean>) => {
    try {
      const didSend = await fn();
      if (didSend) {
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      skipped += 1;
      errors.push(
        `${label}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  if (dryRun) {
    parentConsentReminderPreviews = await loadParentConsentReminderPreviews(now);
    queuedNotificationPreviews = await buildProgramQueuedNotificationPreviews(now);
  }

  await trySend("parent-consent-reminders", async () => {
    if (dryRun) {
      return parentConsentReminderPreviews.length > 0;
    }
    const sentReminders = await sendDueParentConsentReminders(now);
    return sentReminders > 0;
  });

  if (morningSevenWindow && isInSendWindow(hour, morningSevenWindow.startHour, morningSevenWindow.endHour)) {
    if (!dryRun) {
      staleQueueSkipSummary = await skipStaleProgramQueuedNotifications(now);

      if (isMorningPlayerPushWindow(now)) {
        await trySend("queued-player-notifications", async () => {
          await processProgramQueuedNotificationsAfterStalePass(now);
          return false;
        });
      }
    }

    for (const enrollment of enrollments) {
      await trySend(`day-before-start:${enrollment.id}`, () =>
        maybeSendDayBeforeStart(enrollment, dateKey, now, dryRun, previews),
      );
    }

    for (const enrollment of enrollments) {
      await trySend(`daily-routine:${enrollment.id}`, () =>
        maybeSendDailyRoutine(enrollment, dateKey, now, dryRun, previews),
      );
    }

    const setupIncompleteEnrollments = await loadSetupIncompleteEnrollments();
    for (const enrollment of setupIncompleteEnrollments) {
      await trySend(`setup-reminder:${enrollment.id}`, () =>
        maybeSendSetupReminder(enrollment, dryRun, now, previews),
      );
    }
  }

  if (
    saturdayVideoWindow &&
    isInSendWindow(hour, saturdayVideoWindow.startHour, saturdayVideoWindow.endHour) &&
    isScheduleWindowActiveForDay(saturdayVideoWindow, day)
  ) {
    for (const enrollment of enrollments) {
      await trySend(`saturday-video:${enrollment.id}`, () =>
        maybeSendSaturdayVideoReminder(enrollment, dateKey, now, dryRun, previews),
      );
      await trySend(`parent-saturday-video:${enrollment.id}`, () =>
        maybeSendParentSaturdayVideo(enrollment, dateKey, now, dryRun, previews),
      );
    }
  }

  if (goneQuietWindow && isInSendWindow(hour, goneQuietWindow.startHour, goneQuietWindow.endHour)) {
    for (const enrollment of enrollments) {
      await trySend(`gone-quiet:${enrollment.id}`, () =>
        maybeSendGoneQuiet(enrollment, dateKey, now, dryRun, previews),
      );
      await trySend(`parent-gone-quiet:${enrollment.id}`, () =>
        maybeSendParentGoneQuiet(enrollment, dateKey, now, dryRun, previews, isSunday),
      );
    }
  }

  if (
    parentWeeklyRecapWindow &&
    isInSendWindow(hour, parentWeeklyRecapWindow.startHour, parentWeeklyRecapWindow.endHour) &&
    isScheduleWindowActiveForDay(parentWeeklyRecapWindow, day)
  ) {
    for (const enrollment of enrollments) {
      await trySend(`parent-weekly-recap:${enrollment.id}`, () =>
        maybeSendParentWeeklyRecap(enrollment, dateKey, now, dryRun, previews),
      );
    }
  }

  if (coachNightlyWindow && isInSendWindow(hour, coachNightlyWindow.startHour, coachNightlyWindow.endHour)) {
    await trySend("coach-daily-summary", () =>
      maybeSendCoachDailySummary(dateKey, now, dryRun, previews),
    );

    const summaryData = await buildCoachDailySummaryData(dateKey, now);
    await trySend("coach-nightly-summary-push", () =>
      maybeSendCoachNightlySummaryPush({
        dateKey,
        summaryData,
        dryRun,
        previews: coachPushPreviews,
      }),
    );

    const { maybeSendCoachDailySignupSummaryPush } = await import("@/lib/coach-push-scheduler");
    await trySend("coach-daily-signup-summary-push", () =>
      maybeSendCoachDailySignupSummaryPush({
        dateKey,
        dryRun,
        previews: coachPushPreviews,
      }),
    );
  }

  await runScheduledPushJobs({
    dryRun,
    now,
    dateKey,
    hour,
    isSaturday,
    isSunday,
    previews: pushPreviews,
    trySend,
  });

  if (dryRun) {
    sent = 0;
    skipped = 0;
  }

  return {
    dateKey,
    hour,
    activeWindows,
    ...(dryRun
      ? {
          simulatedAt: now.toISOString(),
          atQueryApplied,
        }
      : {}),
    dryRun,
    previews,
    pushPreviews,
    coachPushPreviews,
    parentConsentReminderPreviews,
    staleQueueSkipSummary,
    queuedNotificationPreviews,
    sent: dryRun ? 0 : sent,
    skipped,
    errors,
  };
}

export async function sendTestProgramEmail(params: {
  type: ProgramEmailType;
  enrollmentId: string;
  toEmail: string;
}) {
  const enrollment = await loadActiveEnrollments().then((items) =>
    items.find((item) => item.id === params.enrollmentId),
  );

  if (!enrollment) {
    throw new Error("Enrollment not found.");
  }

  const now = new Date();
  const { dateKey } = getChicagoDateTimeParts(now);
  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const firstName = getPlayerFirstName(enrollment.user.name, enrollment.user.email);
  const testDateKey = `test-${dateKey}`;

  switch (params.type) {
    case "DAILY_ROUTINE": {
      const programDay =
        schedule.programDay > 0 && schedule.dayOfWeek !== 7 ? schedule.programDay : 1;
      const dayInfo = buildProgramDayInfoForProgramDay(
        { startDate: enrollment.startDate },
        programDay,
      );
      const email = buildDailyRoutineEmail({
        firstName,
        weekNumber: dayInfo.weekNumber,
        programDay,
        startDate: enrollment.startDate!,
        tasks: await getEnrollmentTasksForProgramDay(enrollment, programDay),
        streak: await getStreakForEnrollment(enrollment, now),
        knownFor: enrollment.knownFor,
        coachWeekBox: await getEnrollmentCoachWeekBox(enrollment, dayInfo),
      });
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "player",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    case "DAY_BEFORE_START": {
      const email = buildDayBeforeStartEmail({ firstName, knownFor: enrollment.knownFor });
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "player",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    case "SATURDAY_VIDEO_REMINDER": {
      const email = buildSaturdayVideoReminderEmail({ firstName });
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "player",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    case "GONE_QUIET": {
      const silence = getGoneQuietSilence(enrollment.taskCompletions, now);
      const email = buildGoneQuietEmail({ firstName, silence });
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "player",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    case "PARENT_SATURDAY_VIDEO": {
      const email = buildParentSaturdayVideoEmail({
        playerFirstName: firstName,
        unsubscribeUrl: buildParentUnsubscribeUrl(enrollment.id),
      });
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "parent",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    case "PARENT_GONE_QUIET": {
      const tasks = await getEnrollmentTasksForProgramDay(
        enrollment,
        schedule.programDay > 0 ? schedule.programDay : 1,
      );
      const silence = getGoneQuietSilence(enrollment.taskCompletions, now);
      const email = buildParentGoneQuietEmail({
        playerFirstName: firstName,
        silence,
        tasks: tasks.map((task) => ({ title: task.title, target: task.target })),
        unsubscribeUrl: buildParentUnsubscribeUrl(enrollment.id),
      });
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "parent",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    case "PARENT_WEEKLY_RECAP": {
      const recapWeek = (getRecapWeekNumber(schedule) ?? schedule.weekNumber) || 1;
      const recapData = await buildWeeklyRecapData(enrollment, recapWeek);
      if (!recapData) {
        throw new Error("Unable to build weekly recap data.");
      }
      const email = buildParentWeeklyRecapEmail(recapData);
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "parent",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    case "COACH_DAILY_SUMMARY": {
      const summaryData = await buildCoachDailySummaryData(dateKey, now);
      if (!summaryData) {
        throw new Error("No active players for coach summary.");
      }
      const { anyAdminCoachSignupAlertMode } = await import("@/lib/coach-alert-settings");
  const includeSignupDailySection = await anyAdminCoachSignupAlertMode("DAILY");
  const email = buildCoachDailySummaryEmail({
    ...summaryData,
    includeSignupDailySection,
  });
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "coach",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    case "SETUP_REMINDER": {
      const email = buildSetupReminderEmail({ firstName });
      await sendProgramEmail({
        to: params.toEmail,
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
        recipient: "player",
        type: params.type,
        dateKey: testDateKey,
        skipLog: true,
      });
      return email.subject;
    }
    default:
      throw new Error("Unsupported email type.");
  }
}
