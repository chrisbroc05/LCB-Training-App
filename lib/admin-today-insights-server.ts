import "server-only";

import type { Prisma } from "@prisma/client";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import type {
  AdminTodayComingUp,
  AdminTodayCoachingLoad,
  AdminTodayGrowth,
  AdminTodayGrowthDayPoint,
  AdminTodayGrowthSeries,
  AdminTodayInsights,
} from "@/lib/admin-today-insights-shared";
import { getFreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-server";
import { formatDateWithYear } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import {
  addChicagoCalendarDays,
  getChicagoTodayDateKey,
  PROGRAM_DAY_COUNT,
} from "@/lib/program-schedule";
import { getChicagoDayEnd, getChicagoDayStart } from "@/lib/program-email-chicago";
import { getReportsQueueReviewTracks } from "@/lib/reports-queue-shared";
import { getWeekStartMondayChicago } from "@/lib/org-weekly-focus-shared";

function buildChicagoDaySeries(endDateKey: string, dayCount: number): string[] {
  const keys: string[] = [];
  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    keys.push(addChicagoCalendarDays(endDateKey, -offset));
  }
  return keys;
}

function shortDayLabel(dateKey: string) {
  const date = getChicagoDayStart(dateKey);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatWeekRangeLabel(weekStart: Date) {
  const startKey = getChicagoTodayDateKey(weekStart);
  const endKey = addChicagoCalendarDays(startKey, 6);
  const startLabel = formatDateWithYear(getChicagoDayStart(startKey));
  const endLabel = formatDateWithYear(getChicagoDayStart(endKey));
  return `${startLabel} - ${endLabel}`;
}

function averageTurnaroundHours(
  rows: Array<{ createdAt: Date; respondedAt: Date | null }>,
): number | null {
  const deltas: number[] = [];
  for (const row of rows) {
    if (!row.respondedAt) {
      continue;
    }
    const ms = row.respondedAt.getTime() - row.createdAt.getTime();
    if (ms >= 0) {
      deltas.push(ms);
    }
  }
  if (deltas.length === 0) {
    return null;
  }
  const avgMs = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  return Math.round((avgMs / (60 * 60 * 1000)) * 10) / 10;
}

function summarizeGrowthSeries(
  days: AdminTodayGrowthDayPoint[],
  previousDays: AdminTodayGrowthDayPoint[],
): AdminTodayGrowthSeries {
  const totalCurrent = days.reduce((sum, point) => sum + point.value, 0);
  const totalPrevious = previousDays.reduce((sum, point) => sum + point.value, 0);
  let changePercent: number | null = null;
  if (totalPrevious > 0) {
    changePercent = Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 1000) / 10;
  } else if (totalCurrent > 0) {
    changePercent = 100;
  }

  return {
    days,
    totalCurrent,
    totalPrevious,
    changePercent,
  };
}

function bucketCountByChicagoDateKey(rows: Array<{ createdAt: Date }>) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = getChicagoTodayDateKey(row.createdAt);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function bucketSalesCentsByChicagoDateKey(
  rows: Array<{ createdAt: Date; amountCents: number | null }>,
) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = getChicagoTodayDateKey(row.createdAt);
    const cents = row.amountCents ?? 0;
    map.set(key, (map.get(key) ?? 0) + cents);
  }
  return map;
}

function mapCentsMapToDollarsByDay(centsMap: Map<string, number>) {
  const dollars = new Map<string, number>();
  for (const [key, cents] of centsMap.entries()) {
    dollars.set(key, Math.round(cents) / 100);
  }
  return dollars;
}

async function buildCoachingLoad(now: Date, pendingWrittenReports: number): Promise<AdminTodayCoachingLoad> {
  const freeSwingMode = await getFreeSwingAnalysisResponseMode();
  const reportsQueueTracks = getReportsQueueReviewTracks(freeSwingMode);

  const weekStart = getWeekStartMondayChicago(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const writtenWhere: Prisma.SwingAnalysisSubmissionWhereInput = {
    status: "COMPLETED",
    reviewTrack: { in: reportsQueueTracks },
    evaluationPdfR2Key: { not: null },
    respondedAt: { not: null },
  };

  const swingVideoWhere: Prisma.SwingAnalysisSubmissionWhereInput = {
    status: "COMPLETED",
    respondedAt: { not: null },
    OR: [
      { reviewTrack: null },
      { reviewTrack: { notIn: reportsQueueTracks } },
      { evaluationPdfR2Key: null },
    ],
  };

  const [
    videoSwingThisWeek,
    mentalThisWeek,
    writtenThisWeek,
    videoSwingLastWeek,
    mentalLastWeek,
    writtenLastWeek,
    turnaroundRows,
    reportsOpeningNext7Days,
  ] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: { ...swingVideoWhere, respondedAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.mentalGameSubmission.count({
      where: { status: "COMPLETED", respondedAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.swingAnalysisSubmission.count({
      where: { ...writtenWhere, respondedAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.swingAnalysisSubmission.count({
      where: { ...swingVideoWhere, respondedAt: { gte: lastWeekStart, lt: weekStart } },
    }),
    prisma.mentalGameSubmission.count({
      where: { status: "COMPLETED", respondedAt: { gte: lastWeekStart, lt: weekStart } },
    }),
    prisma.swingAnalysisSubmission.count({
      where: { ...writtenWhere, respondedAt: { gte: lastWeekStart, lt: weekStart } },
    }),
    Promise.all([
      prisma.swingAnalysisSubmission.findMany({
        where: { respondedAt: { gte: weekStart, lt: weekEnd }, status: "COMPLETED" },
        select: { createdAt: true, respondedAt: true },
      }),
      prisma.mentalGameSubmission.findMany({
        where: { respondedAt: { gte: weekStart, lt: weekEnd }, status: "COMPLETED" },
        select: { createdAt: true, respondedAt: true },
      }),
    ]).then(([swingRows, mentalRows]) => [...swingRows, ...mentalRows]),
    prisma.user.count({
      where: {
        isTestAccount: false,
        membershipLevel: "CORE",
        coreQuickReportNextEligibleAt: {
          gte: now,
          lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const videoReviewsSent = videoSwingThisWeek + mentalThisWeek;
  const writtenReportsSent = writtenThisWeek;
  const thisWeekTotalSent = videoReviewsSent + writtenReportsSent;
  const lastWeekTotalSent = videoSwingLastWeek + mentalLastWeek + writtenLastWeek;

  return {
    weekLabel: formatWeekRangeLabel(weekStart),
    videoReviewsSent,
    writtenReportsSent,
    averageTurnaroundHours: averageTurnaroundHours(turnaroundRows),
    reportsOpeningNext7Days,
    pendingWrittenReports,
    thisWeekTotalSent,
    lastWeekTotalSent,
  };
}

async function buildGrowth(now: Date): Promise<AdminTodayGrowth> {
  const todayKey = getChicagoTodayDateKey(now);
  const currentKeys = buildChicagoDaySeries(todayKey, 30);
  const previousEndKey = addChicagoCalendarDays(todayKey, -30);
  const previousKeys = buildChicagoDaySeries(previousEndKey, 30);

  const rangeStart = getChicagoDayStart(currentKeys[0]!);
  const previousRangeStart = getChicagoDayStart(previousKeys[0]!);
  const rangeEnd = getChicagoDayEnd(todayKey);

  const [leads, accounts, purchases] = await Promise.all([
    prisma.lead.findMany({
      where: { createdAt: { gte: previousRangeStart, lt: rangeEnd } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { signupDate: { gte: previousRangeStart, lt: rangeEnd }, isTestAccount: false },
      select: { signupDate: true },
    }),
    prisma.resourcePurchase.findMany({
      where: {
        createdAt: { gte: previousRangeStart, lt: rangeEnd },
        refundedAt: null,
      },
      select: { createdAt: true, amountCents: true },
    }),
  ]);

  const leadMap = bucketCountByChicagoDateKey(leads);
  const accountMap = bucketCountByChicagoDateKey(
    accounts.map((row) => ({ createdAt: row.signupDate })),
  );
  const salesCentsMap = bucketSalesCentsByChicagoDateKey(purchases);
  const salesDollarsMap = mapCentsMapToDollarsByDay(salesCentsMap);

  const pickSeries = (map: Map<string, number>, keys: string[]) =>
    keys.map((dateKey) => ({
      dateKey,
      shortLabel: shortDayLabel(dateKey),
      value: map.get(dateKey) ?? 0,
    }));

  const currentLeadDays = pickSeries(leadMap, currentKeys);
  const previousLeadDays = pickSeries(leadMap, previousKeys);
  const currentAccountDays = pickSeries(accountMap, currentKeys);
  const previousAccountDays = pickSeries(accountMap, previousKeys);
  const currentSalesDays = pickSeries(salesDollarsMap, currentKeys);
  const previousSalesDays = pickSeries(salesDollarsMap, previousKeys);

  return {
    leads: summarizeGrowthSeries(currentLeadDays, previousLeadDays),
    accounts: summarizeGrowthSeries(currentAccountDays, previousAccountDays),
    salesDollars: summarizeGrowthSeries(currentSalesDays, previousSalesDays),
  };
}

async function buildComingUp(now: Date): Promise<AdminTodayComingUp> {
  const todayKey = getChicagoTodayDateKey(now);
  const inSevenKeys = addChicagoCalendarDays(todayKey, 7);
  const inFourteenKeys = addChicagoCalendarDays(todayKey, 14);
  const weekStart = getWeekStartMondayChicago(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const trialEndMax = getChicagoDayEnd(inFourteenKeys);

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const parentCutoff = new Date(now.getTime() - threeDaysMs);

  const [organizations, enrollments, coreDueUsers, unconfirmedMinors] = await Promise.all([
    prisma.organization.findMany({
      where: {
        trialEndsAt: { not: null, gte: now, lte: trialEndMax },
        active: true,
      },
      select: {
        id: true,
        name: true,
        trialEndsAt: true,
        _count: { select: { members: true } },
      },
      orderBy: { trialEndsAt: "asc" },
    }),
    prisma.programEnrollment.findMany({
      where: {
        status: "ACTIVE",
        startDate: { not: null },
        user: { isTestAccount: false },
      },
      select: {
        id: true,
        startDate: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        isTestAccount: false,
        membershipLevel: "CORE",
        coreQuickReportNextEligibleAt: { gte: weekStart, lt: weekEnd },
      },
      select: {
        id: true,
        name: true,
        email: true,
        coreQuickReportNextEligibleAt: true,
      },
      orderBy: { coreQuickReportNextEligibleAt: "asc" },
    }),
    prisma.user.findMany({
      where: {
        isTestAccount: false,
        playerAge: { lt: 18 },
        acceptedAsParent: true,
        parentConsentEmail: { not: null },
        parentConsentConfirmedAt: null,
        termsAcceptedAt: { lte: parentCutoff },
      },
      select: { id: true, name: true, email: true },
      orderBy: { termsAcceptedAt: "asc" },
    }),
  ]);

  const orgTrialsEnding = organizations.map((org) => ({
    id: org.id,
    title: org.name,
    subtitle: `Trial ends ${formatDateWithYear(org.trialEndsAt)} | ${org._count.members} members`,
    href: ADMIN_ROUTES.players.organizations,
  }));

  const twelveWeekStartOrFinish: AdminTodayComingUp["twelveWeekStartOrFinish"] = [];
  for (const enrollment of enrollments) {
    if (!enrollment.startDate) {
      continue;
    }
    const startKey = getChicagoTodayDateKey(enrollment.startDate);
    const finishKey = addChicagoCalendarDays(startKey, PROGRAM_DAY_COUNT - 1);
    const playerLabel = enrollment.user.name?.trim() || enrollment.user.email;

    if (startKey >= todayKey && startKey <= inSevenKeys) {
      twelveWeekStartOrFinish.push({
        id: `${enrollment.id}-start`,
        title: playerLabel,
        subtitle: `12-Week starts ${formatDateWithYear(getChicagoDayStart(startKey))}`,
        href: ADMIN_ROUTES.coaching.programPlayer(enrollment.id),
      });
    }

    if (finishKey >= todayKey && finishKey <= inSevenKeys) {
      twelveWeekStartOrFinish.push({
        id: `${enrollment.id}-finish`,
        title: playerLabel,
        subtitle: `12-Week finishes ${formatDateWithYear(getChicagoDayStart(finishKey))}`,
        href: ADMIN_ROUTES.coaching.programPlayer(enrollment.id),
      });
    }
  }

  twelveWeekStartOrFinish.sort((a, b) => a.subtitle.localeCompare(b.subtitle));

  const coreReportsDue = coreDueUsers.map((user) => ({
    id: user.id,
    title: user.name?.trim() || user.email,
    subtitle: `Report window opens ${formatDateWithYear(user.coreQuickReportNextEligibleAt)}`,
    href: ADMIN_ROUTES.coaching.reports,
  }));

  const unconfirmedRows = unconfirmedMinors.map((user) => ({
    id: user.id,
    title: user.name?.trim() || user.email,
    subtitle: "Waiting on parent confirmation",
    href: ADMIN_ROUTES.players.members,
  }));

  return {
    orgTrialsEnding,
    twelveWeekStartOrFinish,
    coreReportsDue,
    unconfirmedMinors: unconfirmedRows,
  };
}

export async function buildAdminTodayInsights(
  now: Date,
  pendingWrittenReports: number,
): Promise<AdminTodayInsights> {
  const [coachingLoad, growth, comingUp] = await Promise.all([
    buildCoachingLoad(now, pendingWrittenReports),
    buildGrowth(now),
    buildComingUp(now),
  ]);

  return { coachingLoad, growth, comingUp };
}
