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
  loadActiveEnrollments,
  shouldSendGoneQuietEmail,
  type ActiveEnrollmentRecord,
} from "@/lib/program-email-data";
import { hasProgramEmailBeenSent, sendProgramEmail } from "@/lib/program-email-send";
import {
  buildCoachDailySummaryEmail,
  buildDailyRoutineEmail,
  buildDayBeforeStartEmail,
  buildGoneQuietEmail,
  buildParentGoneQuietEmail,
  buildParentSaturdayVideoEmail,
  buildParentWeeklyRecapEmail,
  buildSaturdayVideoReminderEmail,
  getPlayerFirstName,
} from "@/lib/program-email-templates";
import { isGoneQuiet } from "@/lib/program-gone-quiet";
import { buildParentUnsubscribeUrl } from "@/lib/program-parent-token";
import { computeProgramStreak, getDayOfWeekForProgramDay } from "@/lib/program-streak-shared";
import { getProgramDay } from "@/lib/program-schedule";
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
  maybeSendCoachNightlySummaryPush,
  type ScheduledCoachPushPreview,
} from "@/lib/coach-push-scheduler";
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
};

export type ProgramEmailRunResult = {
  dateKey: string;
  hour: number;
  activeWindows: string[];
  dryRun: boolean;
  previews: ScheduledEmailPreview[];
  pushPreviews: ScheduledPushPreview[];
  coachPushPreviews: ScheduledCoachPushPreview[];
  sent: number;
  skipped: number;
  errors: string[];
};

async function getStreakForEnrollment(enrollment: ActiveEnrollmentRecord, now: Date) {
  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);
  const planInput = toEnrollmentPlanInput(enrollment);
  const completedWorkDays = new Set<number>();

  if (planInput && enrollment.startDate) {
    for (let day = 1; day <= Math.min(schedule.programDay, 84); day += 1) {
      if (getDayOfWeekForProgramDay(day) === 7) {
        continue;
      }
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
    currentProgramDay: schedule.programDay,
    completedWorkDays,
  });
}

async function maybeSendDailyRoutine(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  if (await userHasPushSubscriptions(enrollment.userId)) {
    return false;
  }

  if (!enrollment.dailyRoutineEmailsEnabled) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate });
  if (
    schedule.isBeforeStart ||
    schedule.isComplete ||
    schedule.programDay <= 0 ||
    schedule.programDay > 84 ||
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
  const streak = await getStreakForEnrollment(enrollment, new Date());

  const email = buildDailyRoutineEmail({
    firstName,
    weekNumber: schedule.weekNumber,
    dayOfWeek: schedule.dayOfWeek,
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
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  if (await userHasPushSubscriptions(enrollment.userId)) {
    return false;
  }

  if (!isDayBeforeStart(enrollment, dateKey)) {
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
  if (!isGoneQuiet(schedule.programDay, completionDays)) {
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
  const email = buildGoneQuietEmail({ firstName });

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

async function maybeSendParentSaturdayVideo(
  enrollment: ActiveEnrollmentRecord,
  dateKey: string,
  now: Date,
  dryRun: boolean,
  previews: ScheduledEmailPreview[],
) {
  if (!enrollment.parentEmail?.trim() || !enrollment.parentEmailsEnabled) {
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
    to: enrollment.parentEmail.trim(),
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: enrollment.parentEmail.trim(),
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
) {
  if (!enrollment.parentEmail?.trim() || !enrollment.parentEmailsEnabled) {
    return false;
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const completionDays = new Set(enrollment.taskCompletions.map((item) => item.programDay));
  if (!isGoneQuiet(schedule.programDay, completionDays)) {
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
  const email = buildParentGoneQuietEmail({
    playerFirstName,
    tasks: tasks.map((task) => ({ title: task.title, target: task.target })),
    unsubscribeUrl: buildParentUnsubscribeUrl(enrollment.id),
  });

  previews.push({
    type,
    recipient: "parent",
    enrollmentId: enrollment.id,
    to: enrollment.parentEmail.trim(),
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: enrollment.parentEmail.trim(),
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
  if (!enrollment.parentEmail?.trim() || !enrollment.parentEmailsEnabled) {
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

  const email = buildParentWeeklyRecapEmail(recapData);

  previews.push({
    type,
    recipient: "parent",
    enrollmentId: enrollment.id,
    to: enrollment.parentEmail.trim(),
    subject: email.subject,
    dateKey,
  });

  if (!dryRun) {
    await sendProgramEmail({
      to: enrollment.parentEmail.trim(),
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

  const email = buildCoachDailySummaryEmail(summaryData);

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
}): Promise<ProgramEmailRunResult> {
  const dryRun = params?.dryRun ?? false;
  const now = params?.now ?? new Date();
  const { dateKey, hour, isSaturday, isSunday } = getChicagoDateTimeParts(now);
  const day = { isSaturday, isSunday };
  const activeWindows = getActiveScheduleWindows(hour, day).map((window) => window.id);
  const previews: ScheduledEmailPreview[] = [];
  const pushPreviews: ScheduledPushPreview[] = [];
  const coachPushPreviews: ScheduledCoachPushPreview[] = [];
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

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

  if (
    morningSevenWindow &&
    isInSendWindow(hour, morningSevenWindow.startHour, morningSevenWindow.endHour)
  ) {
    for (const enrollment of enrollments) {
      await trySend(`day-before-start:${enrollment.id}`, () =>
        maybeSendDayBeforeStart(enrollment, dateKey, dryRun, previews),
      );
    }

    for (const enrollment of enrollments) {
      await trySend(`daily-routine:${enrollment.id}`, () =>
        maybeSendDailyRoutine(enrollment, dateKey, dryRun, previews),
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

  if (
    goneQuietWindow &&
    isInSendWindow(hour, goneQuietWindow.startHour, goneQuietWindow.endHour)
  ) {
    for (const enrollment of enrollments) {
      await trySend(`gone-quiet:${enrollment.id}`, () =>
        maybeSendGoneQuiet(enrollment, dateKey, now, dryRun, previews),
      );
      await trySend(`parent-gone-quiet:${enrollment.id}`, () =>
        maybeSendParentGoneQuiet(enrollment, dateKey, now, dryRun, previews),
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

  if (
    coachNightlyWindow &&
    isInSendWindow(hour, coachNightlyWindow.startHour, coachNightlyWindow.endHour)
  ) {
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

  return {
    dateKey,
    hour,
    activeWindows,
    dryRun,
    previews,
    pushPreviews,
    coachPushPreviews,
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
        dayOfWeek: dayInfo.dayOfWeek,
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
      const email = buildGoneQuietEmail({ firstName });
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
      const email = buildParentGoneQuietEmail({
        playerFirstName: firstName,
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
      const email = buildCoachDailySummaryEmail(summaryData);
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
    default:
      throw new Error("Unsupported email type.");
  }
}
