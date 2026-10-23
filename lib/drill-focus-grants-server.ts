import "server-only";

import {
  collectCoachFocusTemporaryDrillIds,
  collectPermanentRecommendedDrillIds,
  mergeUniqueDrillIds,
} from "@/lib/drill-focus-grants-shared";
import { loadCurrentOrgWeeklyFocusForUser } from "@/lib/org-weekly-focus-server";
import { prisma } from "@/lib/prisma";

export async function loadActiveOrgWeeklyFocusDrillIds(userId: string) {
  const focus = await loadCurrentOrgWeeklyFocusForUser(userId);
  return focus?.drillIds ?? [];
}

export async function loadActiveCoachFocusDrillIds(userId: string, now = new Date()) {
  const swingSubmissions = await prisma.swingAnalysisSubmission.findMany({
    where: {
      userId,
      respondedAt: { not: null },
      coachFocusPreset: { not: null },
    },
    select: {
      recommendedDrills: true,
      coachFocusPreset: true,
      coachFocusEndsAt: true,
    },
  });

  return collectCoachFocusTemporaryDrillIds(swingSubmissions, now);
}

export async function loadPermanentGrantedDrillIds(userId: string) {
  const [swingSubmissions, mentalSubmissions] = await Promise.all([
    prisma.swingAnalysisSubmission.findMany({
      where: { userId, respondedAt: { not: null } },
      select: {
        recommendedDrills: true,
        reportLibraryDrillIds: true,
        coachFocusPreset: true,
      },
    }),
    prisma.mentalGameSubmission.findMany({
      where: { userId, respondedAt: { not: null } },
      select: { recommendedDrills: true },
    }),
  ]);

  return collectPermanentRecommendedDrillIds(swingSubmissions, mentalSubmissions);
}

export async function loadMergedGrantedDrillIdsForUser(userId: string, now = new Date()) {
  const [permanent, orgFocus, coachFocus] = await Promise.all([
    loadPermanentGrantedDrillIds(userId),
    loadActiveOrgWeeklyFocusDrillIds(userId),
    loadActiveCoachFocusDrillIds(userId, now),
  ]);

  return mergeUniqueDrillIds(permanent, orgFocus, coachFocus);
}
