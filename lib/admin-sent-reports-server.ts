import "server-only";

import type { CoachingReviewTrack, Prisma } from "@prisma/client";
import {
  chicagoEndOfCalendarDay,
  chicagoStartOfCalendarDay,
  readChicagoCalendarYmd,
} from "@/lib/org-trial-dates-shared";
import { getWeekStartMondayChicago } from "@/lib/org-weekly-focus-shared";
import {
  parseAdminSentReportLevelFilter,
  reviewTrackForSentLevelFilter,
} from "@/lib/admin-sent-reports-shared";
import { getReportsQueueReviewTracks } from "@/lib/reports-queue-shared";
import type { FreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-shared";
import { prisma } from "@/lib/prisma";

export function buildSentWrittenReportsWhere(params: {
  allowedTracks: CoachingReviewTrack[];
  levelFilter: ReturnType<typeof parseAdminSentReportLevelFilter>;
  organizationId: string | null;
  sentFrom: string | null;
  sentTo: string | null;
  playerSearch: string | null;
}): Prisma.SwingAnalysisSubmissionWhereInput {
  const trackFilter = reviewTrackForSentLevelFilter(params.levelFilter);
  const reviewTracks = trackFilter ? [trackFilter] : params.allowedTracks;

  const respondedAt: Prisma.DateTimeFilter = {};
  if (params.sentFrom?.trim()) {
    const start = chicagoDayStartFromInput(params.sentFrom.trim());
    if (start) {
      respondedAt.gte = start;
    }
  }
  if (params.sentTo?.trim()) {
    const end = chicagoDayEndFromInput(params.sentTo.trim());
    if (end) {
      respondedAt.lte = end;
    }
  }

  const where: Prisma.SwingAnalysisSubmissionWhereInput = {
    status: "COMPLETED",
    reviewTrack: { in: reviewTracks },
    evaluationPdfR2Key: { not: null },
    respondedAt: { not: null, ...respondedAt },
  };

  if (params.organizationId?.trim()) {
    where.user = { organizationId: params.organizationId.trim() };
  }

  const search = params.playerSearch?.trim();
  if (search) {
    where.playerName = { contains: search, mode: "insensitive" };
  }

  return where;
}

function chicagoDayStartFromInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }
  return chicagoStartOfCalendarDay(year, month, day);
}

function chicagoDayEndFromInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }
  return chicagoEndOfCalendarDay(year, month, day);
}

export function getChicagoMonthStart(now = new Date()): Date {
  const { year, month } = readChicagoCalendarYmd(now);
  return chicagoStartOfCalendarDay(year, month, 1);
}

export type SentReportsSummary = {
  sentThisWeek: number;
  sentThisMonth: number;
  sentAllTime: number;
  averageTurnaroundMsLast30Days: number | null;
};

export function buildSentReportsSummaryBaseWhere(
  allowedTracks: CoachingReviewTrack[],
): Prisma.SwingAnalysisSubmissionWhereInput {
  return {
    status: "COMPLETED",
    reviewTrack: { in: allowedTracks },
    evaluationPdfR2Key: { not: null },
    respondedAt: { not: null },
  };
}

export async function computeSentReportsSummary(
  baseWhere: Prisma.SwingAnalysisSubmissionWhereInput,
): Promise<SentReportsSummary> {
  const now = new Date();
  const weekStart = getWeekStartMondayChicago(now);
  const monthStart = getChicagoMonthStart(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [sentThisWeek, sentThisMonth, sentAllTime, turnaroundRows] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: { ...baseWhere, respondedAt: { gte: weekStart } },
    }),
    prisma.swingAnalysisSubmission.count({
      where: { ...baseWhere, respondedAt: { gte: monthStart } },
    }),
    prisma.swingAnalysisSubmission.count({ where: baseWhere }),
    prisma.swingAnalysisSubmission.findMany({
      where: {
        ...baseWhere,
        respondedAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, respondedAt: true },
    }),
  ]);

  let averageTurnaroundMsLast30Days: number | null = null;
  if (turnaroundRows.length > 0) {
    const totalMs = turnaroundRows.reduce((sum, row) => {
      const respondedAt = row.respondedAt!;
      return sum + (respondedAt.getTime() - row.createdAt.getTime());
    }, 0);
    averageTurnaroundMsLast30Days = Math.round(totalMs / turnaroundRows.length);
  }

  return {
    sentThisWeek,
    sentThisMonth,
    sentAllTime,
    averageTurnaroundMsLast30Days,
  };
}

export function allowedSentReportTracks(
  freeSwingMode: FreeSwingAnalysisResponseMode,
): CoachingReviewTrack[] {
  return getReportsQueueReviewTracks(freeSwingMode);
}
