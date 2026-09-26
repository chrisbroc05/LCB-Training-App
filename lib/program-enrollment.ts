import type {
  ProgramAgeGroup,
  ProgramEnrollmentStatus,
  ProgramSeasonMode,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTwelveWeekProgramEndDate } from "@/lib/twelve-week-program";

export const PROGRAM_FOCUS_AREAS = [
  "hitting",
  "fielding",
  "speed",
  "strength",
  "mental",
] as const;

export type ProgramFocusArea = (typeof PROGRAM_FOCUS_AREAS)[number];

export const PROGRAM_EQUIPMENT_OPTIONS = [
  "cage_field",
  "tee_net",
  "glove_wall",
  "weights_gym",
  "nothing_special",
] as const;

export type ProgramEquipmentOption = (typeof PROGRAM_EQUIPMENT_OPTIONS)[number];

export const PROGRAM_POSITION_OPTIONS = [
  "Pitcher",
  "Catcher",
  "Middle infield (SS/2B)",
  "Corner infield (3B/1B)",
  "Outfield",
  "Utility",
] as const;

export const PROGRAM_AGE_GROUP_LABELS: Record<ProgramAgeGroup, string> = {
  AGE_8_11: "8-11",
  AGE_12_15: "12-15",
  AGE_16_18: "16-18",
};

export const PROGRAM_SEASON_MODE_LABELS: Record<ProgramSeasonMode, string> = {
  IN_SEASON: "In season",
  OFF_SEASON: "Off season",
};

export const PROGRAM_FOCUS_AREA_LABELS: Record<ProgramFocusArea, string> = {
  hitting: "Hitting",
  fielding: "Fielding",
  speed: "Speed",
  strength: "Strength",
  mental: "Mental game",
};

export const PROGRAM_EQUIPMENT_LABELS: Record<ProgramEquipmentOption, string> = {
  cage_field: "Cage or field",
  tee_net: "Tee and net",
  glove_wall: "Glove and a wall",
  weights_gym: "Weights or gym",
  nothing_special: "Nothing special",
};

export const PROGRAM_STATUS_LABELS: Record<ProgramEnrollmentStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export function isProgramFocusArea(value: string): value is ProgramFocusArea {
  return PROGRAM_FOCUS_AREAS.includes(value as ProgramFocusArea);
}

export function isProgramEquipmentOption(value: string): value is ProgramEquipmentOption {
  return PROGRAM_EQUIPMENT_OPTIONS.includes(value as ProgramEquipmentOption);
}

export function normalizeFocusAreas(values: string[]) {
  const unique: ProgramFocusArea[] = [];
  for (const value of values) {
    if (!isProgramFocusArea(value)) {
      continue;
    }

    if (!unique.includes(value)) {
      unique.push(value);
    }
  }

  return unique.slice(0, 2);
}

export function normalizeEquipment(values: string[]) {
  const unique: ProgramEquipmentOption[] = [];
  for (const value of values) {
    if (!isProgramEquipmentOption(value)) {
      continue;
    }

    if (!unique.includes(value)) {
      unique.push(value);
    }
  }

  if (unique.includes("nothing_special")) {
    return ["nothing_special"];
  }

  return unique;
}

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
