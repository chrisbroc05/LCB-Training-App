import { NextResponse } from "next/server";
import { formatGoalFocusAreaLabel, serializeGoalItem } from "@/lib/goal-check-in-constants";
import { requireGoalCheckinMember } from "@/lib/goal-checkin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await requireGoalCheckinMember();
  if (access.error) {
    return access.error;
  }

  const submissions = await prisma.goalCheckin.findMany({
    where: { userId: access.session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      goals: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({
    entries: submissions.map((submission) => ({
      id: submission.id,
      createdAt: submission.createdAt.toISOString(),
      monthlyFocus: submission.monthlyFocus,
      lastMonthReview: submission.lastMonthReview,
      focusArea: submission.focusArea,
      focusAreaLabel: formatGoalFocusAreaLabel(submission.focusArea),
      additionalNotes: submission.additionalNotes,
      coachResponse: submission.coachResponse,
      status: submission.status,
      respondedAt: submission.respondedAt?.toISOString() ?? null,
      goals: submission.goals.map(serializeGoalItem),
    })),
  });
}
