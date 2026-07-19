import { prisma } from "@/lib/prisma";

export const GOAL_FOCUS_AREAS = [
  "hitting",
  "fielding",
  "speed",
  "strength",
  "mental game",
] as const;

export type GoalFocusArea = (typeof GOAL_FOCUS_AREAS)[number];

export function isGoalFocusArea(value: string): value is GoalFocusArea {
  return GOAL_FOCUS_AREAS.includes(value as GoalFocusArea);
}

export function getCurrentMonthBoundsUtc() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function formatGoalFocusAreaLabel(focusArea: string) {
  if (focusArea === "mental game") {
    return "Mental Game";
  }

  return focusArea.charAt(0).toUpperCase() + focusArea.slice(1);
}

export async function getCurrentMonthGoalCheckin(userId: string) {
  const { start, end } = getCurrentMonthBoundsUtc();

  return prisma.goalCheckin.findFirst({
    where: {
      userId,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGoalCheckinAvailability(userId: string) {
  const currentSubmission = await getCurrentMonthGoalCheckin(userId);

  if (currentSubmission) {
    return {
      canSubmit: false,
      currentSubmission,
      message: "You have already submitted your goals for this month. Check back next month.",
    };
  }

  return {
    canSubmit: true,
    currentSubmission: null,
    message: null,
  };
}
