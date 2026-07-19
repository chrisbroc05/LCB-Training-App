import { getCurrentMonthBoundsUtc, GOAL_CHECKIN_ALREADY_SUBMITTED_MESSAGE } from "@/lib/goal-check-in-constants";
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
    const canEdit =
      currentSubmission.status === "pending" && !currentSubmission.coachResponse;

    return {
      canSubmit: false,
      canEdit,
      currentSubmission,
      message: canEdit
        ? "You have already submitted your goals for this month. You can edit your submission below until Coach Broc responds."
        : GOAL_CHECKIN_ALREADY_SUBMITTED_MESSAGE,
    };
  }

  return {
    canSubmit: true,
    canEdit: false,
    currentSubmission: null,
    message: null,
  };
}
