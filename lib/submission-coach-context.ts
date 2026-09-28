import "server-only";

import type { DatabaseTier } from "@/lib/membership";
import { PROGRAM_AGE_GROUP_LABELS, type ProgramAgeGroup } from "@/lib/program-enrollment-shared";
import { getProgramDay } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";

export async function getCoachSubmissionEmailContext(userId: string, membershipTier: DatabaseTier) {
  if (membershipTier !== "TWELVE_WEEK") {
    return {
      ageGroupLabel: null as string | null,
      programWeekNumber: null as number | null,
    };
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId },
    select: {
      ageGroup: true,
      startDate: true,
    },
  });

  if (!enrollment?.startDate || !enrollment.ageGroup) {
    return {
      ageGroupLabel: null as string | null,
      programWeekNumber: null as number | null,
    };
  }

  const programDay = getProgramDay({ startDate: enrollment.startDate });

  return {
    ageGroupLabel: PROGRAM_AGE_GROUP_LABELS[enrollment.ageGroup as ProgramAgeGroup],
    programWeekNumber: programDay.weekNumber > 0 ? programDay.weekNumber : null,
  };
}
