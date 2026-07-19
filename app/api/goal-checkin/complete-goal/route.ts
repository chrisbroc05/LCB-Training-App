import { NextResponse } from "next/server";
import { isWithinCurrentMonthUtc } from "@/lib/goal-check-in-constants";
import { requireGoalCheckinMember } from "@/lib/goal-checkin-api";
import { prisma } from "@/lib/prisma";

type CompleteGoalBody = {
  goalItemId?: number;
};

export async function POST(request: Request) {
  const access = await requireGoalCheckinMember();
  if (access.error) {
    return access.error;
  }

  let body: CompleteGoalBody;
  try {
    body = (await request.json()) as CompleteGoalBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const goalItemId = body.goalItemId;
  if (!goalItemId || !Number.isFinite(goalItemId)) {
    return NextResponse.json({ error: "A valid goal item id is required." }, { status: 400 });
  }

  const goalItem = await prisma.goalItem.findUnique({
    where: { id: goalItemId },
    include: {
      checkin: {
        select: {
          userId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!goalItem || goalItem.checkin.userId !== access.session.user.id) {
    return NextResponse.json({ error: "Goal item not found." }, { status: 404 });
  }

  if (!isWithinCurrentMonthUtc(goalItem.checkin.createdAt)) {
    return NextResponse.json(
      { error: "Only this month's goals can be updated." },
      { status: 403 },
    );
  }

  const nextCompleted = !goalItem.completed;

  const updated = await prisma.goalItem.update({
    where: { id: goalItem.id },
    data: {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date() : null,
    },
  });

  return NextResponse.json({
    success: true,
    goal: {
      id: updated.id,
      completed: updated.completed,
      completedAt: updated.completedAt?.toISOString() ?? null,
    },
  });
}
