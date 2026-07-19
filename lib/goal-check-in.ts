import { getCurrentMonthBoundsUtc } from "@/lib/goal-check-in-constants";
import { prisma } from "@/lib/prisma";

export {
  GOAL_FOCUS_AREAS,
  formatGoalFocusAreaLabel,
  getCurrentMonthBoundsUtc,
  isGoalFocusArea,
  type GoalFocusArea,
} from "@/lib/goal-check-in-constants";

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
    include: {
      goals: {
        orderBy: { createdAt: "asc" },
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
