import "server-only";

import { resolveEffectiveLevel } from "@/lib/access-shared";
import { ensureCoachingSubmissionPeriod } from "@/lib/coaching-submissions";
import { getCoachingSubmissionAvailability } from "@/lib/coaching-submissions-shared";
import { getReportsQueueReviewTracks } from "@/lib/reports-queue-shared";
import { getFreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-server";
import { formatDateWithYear } from "@/lib/format-date";
import { loadCurrentOrgWeeklyFocusForUser } from "@/lib/org-weekly-focus-server";
import { prisma } from "@/lib/prisma";
import type { KeepBuildingCoachingContext } from "@/lib/coaching-keep-building-shared";
import { shouldShowKeepBuildingCard } from "@/lib/coaching-keep-building-shared";

export async function loadKeepBuildingCoachingContextForUser(
  userId: string,
): Promise<KeepBuildingCoachingContext | null> {
  const userFields = await ensureCoachingSubmissionPeriod(userId);
  if (!userFields) {
    return null;
  }

  const effective = resolveEffectiveLevel(userFields);
  const freeSwingMode = await getFreeSwingAnalysisResponseMode();
  const reportsQueueTracks = getReportsQueueReviewTracks(freeSwingMode);
  const pendingQuick = await prisma.swingAnalysisSubmission.findFirst({
    where: {
      userId,
      status: "PENDING",
      reviewTrack: { in: reportsQueueTracks },
    },
    select: { id: true },
  });

  const availability = getCoachingSubmissionAvailability(userFields, new Date(), {
    hasPendingQuickWrittenReport: Boolean(pendingQuick),
  });

  if (
    !shouldShowKeepBuildingCard({
      effectiveLevel: effective,
      canSubmit: availability.canSubmit,
      hasPendingQuickReport: Boolean(pendingQuick),
    })
  ) {
    return null;
  }

  const lastReport = await prisma.swingAnalysisSubmission.findFirst({
    where: {
      userId,
      status: "COMPLETED",
      reportAreasToImprove: { isEmpty: false },
    },
    orderBy: { respondedAt: "desc" },
    select: {
      id: true,
      reportAreasToImprove: true,
      reportLibraryDrillIds: true,
    },
  });

  if (!lastReport) {
    return null;
  }

  const nextEligibleAt = userFields.coreQuickReportNextEligibleAt
    ? new Date(userFields.coreQuickReportNextEligibleAt)
    : null;

  let nextEligibleLabel = availability.resetsOnLabel ?? "soon";
  if (effective === "CORE" && nextEligibleAt && !Number.isNaN(nextEligibleAt.getTime())) {
    nextEligibleLabel = formatDateWithYear(nextEligibleAt);
  } else if (effective === "PLUS" && availability.resetsOnLabel) {
    nextEligibleLabel = availability.resetsOnLabel;
  }

  const weeklyFocus = await loadCurrentOrgWeeklyFocusForUser(userId);

  return {
    nextEligibleLabel,
    areasToImprove: lastReport.reportAreasToImprove.slice(0, 2),
    libraryDrillIds: lastReport.reportLibraryDrillIds,
    lastSubmissionId: lastReport.id,
    weeklyFocusTitle: weeklyFocus?.title ?? null,
  };
}
