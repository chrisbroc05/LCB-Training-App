import "server-only";

import type {
  ProgramAgeGroup,
  ProgramEnrollmentStatus,
  ProgramSeasonMode,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTwelveWeekProgramEndDate } from "@/lib/twelve-week-program";

export * from "@/lib/program-enrollment-shared";

export async function ensureProgramEnrollmentForUser(userId: string) {
  return prisma.programEnrollment.upsert({
    where: { userId },
    create: {
      userId,
      status: "ACTIVE",
    },
    update: {},
  });
}

export async function activateTwelveWeekProgramAccess(userId: string) {
  const startedAt = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      membershipTier: "TWELVE_WEEK",
      pendingCheckoutTier: null,
      subscriptionStatus: "NONE",
      stripeSubscriptionId: null,
      subscriptionCurrentPeriodEnd: null,
      subscriptionCancelAtPeriodEnd: false,
      twelveWeekProgramStartedAt: startedAt,
      twelveWeekProgramEndsAt: getTwelveWeekProgramEndDate(startedAt),
    },
  });

  return ensureProgramEnrollmentForUser(userId);
}

export function serializeProgramEnrollment(enrollment: {
  id: string;
  userId: string;
  status: ProgramEnrollmentStatus;
  startDate: Date | null;
  ageGroup: ProgramAgeGroup | null;
  position: string | null;
  focusAreas: string[];
  equipment: string[];
  seasonMode: ProgramSeasonMode | null;
  knownFor: string | null;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: enrollment.id,
    userId: enrollment.userId,
    status: enrollment.status,
    startDate: enrollment.startDate ? enrollment.startDate.toISOString().slice(0, 10) : null,
    ageGroup: enrollment.ageGroup,
    position: enrollment.position,
    focusAreas: enrollment.focusAreas,
    equipment: enrollment.equipment,
    seasonMode: enrollment.seasonMode,
    knownFor: enrollment.knownFor,
    onboardingCompletedAt: enrollment.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: enrollment.createdAt.toISOString(),
    updatedAt: enrollment.updatedAt.toISOString(),
  };
}
