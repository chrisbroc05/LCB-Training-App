import "server-only";

import { prisma } from "@/lib/prisma";
import { buildAdminProgramOverview } from "@/lib/admin-program-overview";
import { getFreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-server";
import { getReportsQueueReviewTracks } from "@/lib/reports-queue-shared";
import { loadUnconfirmedMinorParentSummaries } from "@/lib/legal-server";
import { getChicagoTodayDateKey } from "@/lib/program-schedule";
import { getChicagoDayEnd, getChicagoDayStart } from "@/lib/program-email-chicago";

import type { AdminTodayAttention, AdminTodaySnapshot } from "@/lib/admin-today-shared";

export type { AdminTodayAttention, AdminTodaySnapshot } from "@/lib/admin-today-shared";

export async function buildAdminTodaySnapshot(now = new Date()): Promise<AdminTodaySnapshot> {
  const dateKey = getChicagoTodayDateKey(now);
  const start = getChicagoDayStart(dateKey);
  const end = getChicagoDayEnd(dateKey);

  const freeSwingMode = await getFreeSwingAnalysisResponseMode();
  const reportsQueueTracks = getReportsQueueReviewTracks(freeSwingMode);

  const [
    swingVideoPending,
    mentalPending,
    writtenReportsPending,
    unreadMessagesCount,
    leadsTodayCount,
    salesTodayCount,
    pendingGoalCheckinsCount,
    unconfirmedMinorNames,
    programOverview,
    checkoutStartedRows,
  ] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: {
        status: { in: ["PENDING", "REVIEWING"] },
        OR: [{ reviewTrack: null }, { reviewTrack: { notIn: reportsQueueTracks } }],
      },
    }),
    prisma.mentalGameSubmission.count({
      where: { status: { in: ["PENDING", "REVIEWING"] } },
    }),
    prisma.swingAnalysisSubmission.count({
      where: {
        status: "PENDING",
        reviewTrack: { in: reportsQueueTracks },
      },
    }),
    prisma.conversation.aggregate({ _sum: { coachUnreadCount: true } }),
    prisma.lead.count({
      where: { createdAt: { gte: start, lt: end } },
    }),
    prisma.resourcePurchase.count({
      where: { createdAt: { gte: start, lt: end } },
    }),
    prisma.goalCheckin.count({ where: { status: "pending" } }),
    loadUnconfirmedMinorParentSummaries(now),
    buildAdminProgramOverview(now),
    prisma.leadResource.findMany({
      where: { checkoutStartedAt: { not: null } },
      select: {
        resourceSlug: true,
        checkoutStartedAt: true,
        lead: { select: { email: true } },
      },
    }),
  ]);

  const allPurchases = await prisma.resourcePurchase.findMany({
    select: { email: true, resourceSlug: true },
  });
  const purchasedEverKeys = new Set(
    allPurchases.map((row) => `${row.email.toLowerCase()}:${row.resourceSlug}`),
  );

  let checkoutsStartedOpenCount = 0;
  for (const row of checkoutStartedRows) {
    if (!row.checkoutStartedAt) {
      continue;
    }
    const key = `${row.lead.email.toLowerCase()}:${row.resourceSlug}`;
    if (!purchasedEverKeys.has(key)) {
      checkoutsStartedOpenCount += 1;
    }
  }

  const goneQuietCount = programOverview.players.filter((player) => player.goneQuiet).length;
  const waitingOnSetupCount = programOverview.waitingOnSetup.length;

  const attention: AdminTodayAttention = {
    goneQuietCount,
    waitingOnSetupCount,
    pendingGoalCheckinsCount,
    unconfirmedMinorsCount: unconfirmedMinorNames.length,
    unconfirmedMinorNames,
    total:
      goneQuietCount +
      waitingOnSetupCount +
      pendingGoalCheckinsCount +
      unconfirmedMinorNames.length,
  };

  return {
    videoReviewsWaiting: swingVideoPending + mentalPending,
    writtenReportsWaiting: writtenReportsPending,
    unreadMessagesCount: unreadMessagesCount._sum.coachUnreadCount ?? 0,
    leadsTodayCount,
    checkoutsStartedOpenCount,
    salesTodayCount,
    attention,
  };
}

export async function buildAdminNavCounts(now = new Date()) {
  const snapshot = await buildAdminTodaySnapshot(now);
  return {
    coachingBadge:
      snapshot.videoReviewsWaiting +
      snapshot.writtenReportsWaiting +
      snapshot.unreadMessagesCount,
    videoReviewsWaiting: snapshot.videoReviewsWaiting,
    writtenReportsWaiting: snapshot.writtenReportsWaiting,
    unreadMessagesCount: snapshot.unreadMessagesCount,
    leadsTodayCount: snapshot.leadsTodayCount,
  };
}
