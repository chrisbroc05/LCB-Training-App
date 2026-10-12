import "server-only";

import { getPlayerFirstName } from "@/lib/program-email-templates";
import { buildAdminSubmissionUrl } from "@/lib/coach-push-shared";
import { listCoachNotes } from "@/lib/coach-note-server";
import { getCurrentMonthGoalCheckin } from "@/lib/goal-check-in";
import { isGoneQuiet } from "@/lib/program-gone-quiet";
import {
  getDateForProgramDay,
  getProgramDay,
  getProgramEndDateKey,
  getProgramWeekNumber,
  getProgramWeekStartProgramDay,
  getWeekdayNameForProgramDay,
  PROGRAM_DAY_COUNT,
} from "@/lib/program-schedule";
import { getTaskKeysForDay } from "@/lib/program-daily-plan";
import {
  buildProgramDayInfoForProgramDay,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import { buildAdminPlayerVideoSections } from "@/lib/coach-video-server";
import { loadTaskFeedbackMap } from "@/lib/task-feedback-server";
import { formatDateWithYear, formatDateTime, formatRelativeTime } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import type { buildAdminProgramPlayerDetail } from "@/lib/admin-program-player";

export type PlayerStatusPill =
  | "on_track"
  | "slipping"
  | "gone_quiet"
  | "waiting_on_setup"
  | "program_ended";

export async function buildAdminProgramPlayerProfile(
  detail: NonNullable<Awaited<ReturnType<typeof buildAdminProgramPlayerDetail>>>,
  now = new Date(),
) {
  const enrollment = await prisma.programEnrollment.findUnique({
    where: { id: detail.enrollment.id },
    include: {
      user: {
        select: {
          id: true,
          parentConsentConfirmedAt: true,
          playerAge: true,
        },
      },
      conversation: { select: { coachUnreadCount: true, id: true } },
      taskCompletions: {
        select: { programDay: true, taskKey: true, note: true, completedAt: true, id: true },
      },
    },
  });

  if (!enrollment) {
    return null;
  }

  if (!enrollment.startDate) {
    const coachNotesOnly = await listCoachNotes(enrollment.id);
    return {
      header: {
        status: "waiting_on_setup" as PlayerStatusPill,
        weekNumber: 0,
        programDay: 0,
        progressPercent: 0,
        startDateLabel: "Not set",
        endDateLabel: "Not set",
        streak: detail.streak,
        weekCompletionPercent: 0,
        weekTasksDone: 0,
        weekTasksDue: 0,
        lastActiveLabel: "Never",
        pinnedNotePreview: coachNotesOnly.find((n) => n.pinned)?.body.slice(0, 120) ?? null,
        playerName: detail.enrollment.name ?? detail.enrollment.email,
        playerFirstName: getPlayerFirstName(detail.enrollment.name, detail.enrollment.email),
        position: detail.enrollment.position,
        ageGroupLabel: detail.enrollment.ageGroupLabel,
      },
      overview: null,
      goalChatPrefill: "",
      attention: [{ id: "setup", label: "Setup not finished" }],
      coachNotes: coachNotesOnly.map((note) => ({
        id: note.id,
        body: note.body,
        pinned: note.pinned,
        createdAt: formatDateTime(note.createdAt),
        updatedAt: formatDateTime(note.updatedAt),
      })),
      goals: { current: null, history: [] },
      submissions: [],
      videoSections: { fromPlayer: [], sentByCoach: [] },
      testingSummary: null,
      feedbackMap: {},
    };
  }

  const schedule = getProgramDay({ startDate: enrollment.startDate }, now);
  const planInput = toEnrollmentPlanInput(enrollment);
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(enrollment.id);
  const feedbackMap = await loadTaskFeedbackMap(enrollment.id);
  const coachNotes = await listCoachNotes(enrollment.id);

  const completionDays = new Set(enrollment.taskCompletions.map((c) => c.programDay));
  const goneQuiet = isGoneQuiet(enrollment.startDate, schedule.programDay, completionDays);

  const currentWeek = schedule.weekNumber > 0 ? schedule.weekNumber : 1;
  const weekStartDay = getProgramWeekStartProgramDay(currentWeek);
  const weekEndDay = Math.min(currentWeek * 7, PROGRAM_DAY_COUNT);

  let weekDue = 0;
  let weekDone = 0;
  const missedDaysThisWeek: string[] = [];

  if (planInput) {
    for (let day = weekStartDay; day <= weekEndDay && day <= schedule.programDay; day += 1) {
      const dayInfo = buildProgramDayInfoForProgramDay(
        { startDate: enrollment.startDate },
        day,
      );
      if (dayInfo.dayOfWeek === 7 || dayInfo.isBeforeStart) {
        continue;
      }
      const overrides = buildOverridesForWeekAndDay(overrideBundle, dayInfo.weekNumber, day);
      const keys = getTaskKeysForDay(planInput, dayInfo, overrides);
      if (keys.length === 0) {
        continue;
      }
      weekDue += keys.length;
      const done = keys.filter((key) =>
        enrollment.taskCompletions.some((c) => c.programDay === day && c.taskKey === key),
      ).length;
      weekDone += done;
      if (day < schedule.programDay && done < keys.length) {
        missedDaysThisWeek.push(getWeekdayNameForProgramDay(enrollment.startDate, day));
      }
    }
  }

  const weekCompletionPercent = weekDue > 0 ? Math.round((weekDone / weekDue) * 100) : 0;

  let status: PlayerStatusPill = "on_track";
  if (!enrollment.onboardingCompletedAt) {
    status = "waiting_on_setup";
  } else if (schedule.isComplete) {
    status = "program_ended";
  } else if (goneQuiet) {
    status = "gone_quiet";
  } else if (missedDaysThisWeek.length >= 2) {
    status = "slipping";
  }

  const endDateKey = getProgramEndDateKey(enrollment.startDate);
  const endDate = getDateForProgramDay(enrollment.startDate, PROGRAM_DAY_COUNT);
  const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  const lastCompletion = enrollment.taskCompletions.reduce<Date | null>((latest, item) => {
    if (!latest || item.completedAt > latest) {
      return item.completedAt;
    }
    return latest;
  }, null);

  const notesNeedingFeedback = enrollment.taskCompletions.filter((completion) => {
    if (!completion.note.trim()) {
      return false;
    }
    const feedback = feedbackMap.get(`${completion.programDay}:${completion.taskKey}`);
    return !feedback || (!feedback.liked && !feedback.comment);
  });

  const pendingSubmissions = await prisma.swingAnalysisSubmission.findMany({
    where: { userId: enrollment.userId, status: { in: ["PENDING", "REVIEWING"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const pendingMental = await prisma.mentalGameSubmission.findMany({
    where: { userId: enrollment.userId, status: { in: ["PENDING", "REVIEWING"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const currentGoals = await getCurrentMonthGoalCheckin(enrollment.userId);
  const goalHistory = await prisma.goalCheckin.findMany({
    where: { userId: enrollment.userId },
    include: { goals: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const allSubmissions = [
    ...(await prisma.swingAnalysisSubmission.findMany({
      where: { userId: enrollment.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })).map((s) => ({
      id: s.id,
      type: "swing" as const,
      createdAt: s.createdAt.toISOString(),
      status: s.status,
      note: s.notes,
      href: buildAdminSubmissionUrl("swing", s.id),
      respondedAt: s.respondedAt?.toISOString() ?? null,
    })),
    ...(await prisma.mentalGameSubmission.findMany({
      where: { userId: enrollment.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })).map((s) => ({
      id: s.id,
      type: "mental" as const,
      createdAt: s.createdAt.toISOString(),
      status: s.status,
      note: s.message,
      href: buildAdminSubmissionUrl("mental", s.id),
      respondedAt: s.respondedAt?.toISOString() ?? null,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const testPlayer = await prisma.testPlayer.findFirst({
    where: {
      OR: [{ userId: enrollment.userId }, { parentEmail: detail.enrollment.parentEmail ?? "" }],
    },
    select: { id: true },
  });

  let testingSummary: { playerId: string; href: string } | null = null;
  if (testPlayer) {
    testingSummary = {
      playerId: testPlayer.id,
      href: `/admin/testing/players/${testPlayer.id}`,
    };
  }

  const attention: Array<{
    id: string;
    label: string;
    detail?: string;
    href?: string;
    actionLabel?: string;
  }> = [];

  for (const sub of pendingSubmissions.slice(0, 3)) {
    attention.push({
      id: `swing-${sub.id}`,
      label: "Swing video waiting for your response",
      detail: formatDateTime(sub.createdAt),
      href: buildAdminSubmissionUrl("swing", sub.id),
      actionLabel: "Open",
    });
  }
  for (const sub of pendingMental.slice(0, 3)) {
    attention.push({
      id: `mental-${sub.id}`,
      label: "Mental game video waiting for your response",
      detail: formatDateTime(sub.createdAt),
      href: buildAdminSubmissionUrl("mental", sub.id),
      actionLabel: "Open",
    });
  }

  if (enrollment.conversation && enrollment.conversation.coachUnreadCount > 0) {
    attention.push({
      id: "messages",
      label: `${enrollment.conversation.coachUnreadCount} unread message(s) from player`,
      href: `/admin/messages/${enrollment.conversation.id}`,
      actionLabel: "Open chat",
    });
  }

  if (missedDaysThisWeek.length > 0) {
    attention.push({
      id: "missed-days",
      label: "Missed days this week",
      detail: missedDaysThisWeek.join(", "),
    });
  }

  if (!currentGoals) {
    const firstName = getPlayerFirstName(detail.enrollment.name, detail.enrollment.email);
    attention.push({
      id: "no-goals",
      label: "No goals set yet",
      detail: `Prefill chat for ${firstName}`,
    });
  }

  if (notesNeedingFeedback.length > 0) {
    attention.push({
      id: "task-notes",
      label: `${notesNeedingFeedback.length} task note(s) without your like or comment`,
      href: "#this-week",
      actionLabel: "View week",
    });
  }

  if (
    detail.enrollment.legalAcceptance.parentConsentStatus &&
    detail.enrollment.legalAcceptance.parentConsentStatus.includes("Not confirmed")
  ) {
    attention.push({
      id: "parent-consent",
      label: "Parent has not confirmed the agreement",
    });
  }

  if (!enrollment.onboardingCompletedAt) {
    attention.push({ id: "setup", label: "Setup not finished" });
  }

  if (daysUntilEnd >= 0 && daysUntilEnd <= 7 && !schedule.isComplete) {
    attention.push({
      id: "ending-soon",
      label: "Program ending within 7 days",
      detail: formatDateWithYear(endDate),
    });
  }

  const pinnedNotePreview = coachNotes.find((n) => n.pinned)?.body.slice(0, 120) ?? null;
  const playerFirstName = getPlayerFirstName(detail.enrollment.name, detail.enrollment.email);
  const videoSections = await buildAdminPlayerVideoSections(enrollment.userId);

  return {
    header: {
      status,
      weekNumber: schedule.weekNumber,
      programDay: schedule.programDay,
      progressPercent: Math.round((schedule.weekNumber / 12) * 100),
      startDateLabel: formatDateWithYear(enrollment.startDate),
      endDateLabel: formatDateWithYear(endDate),
      streak: detail.streak,
      weekCompletionPercent,
      weekTasksDone: weekDone,
      weekTasksDue: weekDue,
      lastActiveLabel: formatRelativeTime(lastCompletion, now),
      pinnedNotePreview,
      playerName: detail.enrollment.name ?? detail.enrollment.email,
      playerFirstName,
      position: detail.enrollment.position,
      ageGroupLabel: detail.enrollment.ageGroupLabel,
    },
    overview: {
      knownFor: detail.enrollment.knownFor,
      focusAreaLabels: detail.enrollment.focusAreaLabels,
      position: detail.enrollment.position,
      equipmentLabels: detail.enrollment.equipmentLabels,
      strengthVariantLabel: detail.enrollment.strengthVariantLabel,
      seasonModeLabel: detail.enrollment.seasonModeLabel,
      ageGroupLabel: detail.enrollment.ageGroupLabel,
      email: detail.enrollment.email,
      parentEmail: detail.enrollment.parentEmail,
      parentName: detail.enrollment.parentName,
      parentEmailsEnabled: detail.enrollment.parentEmailsEnabled,
      dailyRoutineEmailsEnabled: detail.enrollment.dailyRoutineEmailsEnabled,
      inPersonTraining: detail.enrollment.inPersonTraining,
      legalAcceptance: detail.enrollment.legalAcceptance,
    },
    goalChatPrefill: `Hey ${playerFirstName}, let's set your goals for this month. What are 1-2 things you want to get better at?`,
    attention,
    coachNotes: coachNotes.map((note) => ({
      id: note.id,
      body: note.body,
      pinned: note.pinned,
      createdAt: formatDateTime(note.createdAt),
      updatedAt: formatDateTime(note.updatedAt),
    })),
    goals: {
      current: currentGoals
        ? {
            id: currentGoals.id,
            monthlyFocus: currentGoals.monthlyFocus,
            lastMonthReview: currentGoals.lastMonthReview,
            focusArea: currentGoals.focusArea,
            additionalNotes: currentGoals.additionalNotes,
            coachResponse: currentGoals.coachResponse,
            status: currentGoals.status,
            createdAt: formatDateTime(currentGoals.createdAt),
            goals: currentGoals.goals.map((g) => ({
              id: g.id,
              category: g.category,
              description: g.description,
              targetValue: g.targetValue,
              completed: g.completed,
            })),
          }
        : null,
      history: goalHistory.map((entry) => ({
        id: entry.id,
        createdAt: formatDateTime(entry.createdAt),
        monthlyFocus: entry.monthlyFocus,
        coachResponse: entry.coachResponse,
      })),
    },
    submissions: allSubmissions,
    videoSections,
    testingSummary,
    feedbackMap: Object.fromEntries(
      [...feedbackMap.entries()].map(([key, value]) => [
        key,
        {
          id: value.id,
          liked: value.liked,
          comment: value.comment,
          seenAt: value.seenAt?.toISOString() ?? null,
          updatedAt: formatDateTime(value.updatedAt),
        },
      ]),
    ),
  };
}

export function serializeFeedbackForTask(
  feedbackMap: Record<string, { id: string; liked: boolean; comment: string | null }>,
  programDay: number,
  taskKey: string,
) {
  return feedbackMap[`${programDay}:${taskKey}`] ?? null;
}

export function getCalendarDateLabel(startDate: Date, programDay: number) {
  if (programDay <= 0) {
    return "";
  }
  return formatDateWithYear(getDateForProgramDay(startDate, programDay));
}
