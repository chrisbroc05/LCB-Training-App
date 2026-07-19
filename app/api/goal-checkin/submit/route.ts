import { NextResponse } from "next/server";
import {
  GOAL_CHECKIN_SUBMITTED_MESSAGE,
  isGoalFocusArea,
  isGoalItemCategory,
  isWithinCurrentMonthUtc,
  MAX_GOAL_ITEMS,
} from "@/lib/goal-check-in-constants";
import { getGoalCheckinAvailability } from "@/lib/goal-check-in";
import { requireGoalCheckinMember } from "@/lib/goal-checkin-api";
import {
  sendGoalCheckinReceivedEmail,
  sendGoalCheckinSubmissionNotification,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type GoalItemInput = {
  category?: string;
  description?: string;
  targetValue?: string;
};

type SubmitBody = {
  submissionId?: number;
  monthlyFocus?: string;
  lastMonthReview?: string;
  focusArea?: string;
  additionalNotes?: string;
  goals?: GoalItemInput[];
};

function normalizeGoalItems(goals: GoalItemInput[] | undefined) {
  if (!Array.isArray(goals)) {
    return [];
  }

  return goals
    .map((goal) => ({
      category: goal.category?.trim() ?? "",
      description: goal.description?.trim() ?? "",
      targetValue: goal.targetValue?.trim() || null,
    }))
    .filter((goal) => goal.category || goal.description || goal.targetValue)
    .slice(0, MAX_GOAL_ITEMS);
}

export async function POST(request: Request) {
  const access = await requireGoalCheckinMember();
  if (access.error) {
    return access.error;
  }

  const { session, user } = access;

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const monthlyFocus = body.monthlyFocus?.trim() ?? "";
  const lastMonthReview = body.lastMonthReview?.trim() ?? "";
  const focusArea = body.focusArea?.trim() ?? "";
  const additionalNotes = body.additionalNotes?.trim() || null;
  const normalizedGoals = normalizeGoalItems(body.goals);
  const submissionId = body.submissionId;

  if (!monthlyFocus || !lastMonthReview || !focusArea) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  if (!isGoalFocusArea(focusArea)) {
    return NextResponse.json({ error: "Please select a valid focus area." }, { status: 400 });
  }

  if (normalizedGoals.length === 0) {
    return NextResponse.json({ error: "Please add at least one monthly goal." }, { status: 400 });
  }

  for (const goal of normalizedGoals) {
    if (!goal.category || !goal.description) {
      return NextResponse.json(
        { error: "Each monthly goal needs a category and description." },
        { status: 400 },
      );
    }

    if (!isGoalItemCategory(goal.category)) {
      return NextResponse.json({ error: "Please select a valid goal category." }, { status: 400 });
    }
  }

  const memberName = user.name?.trim() || user.email;

  if (submissionId) {
    const existing = await prisma.goalCheckin.findUnique({
      where: { id: submissionId },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    if (!isWithinCurrentMonthUtc(existing.createdAt)) {
      return NextResponse.json(
        { error: "Only this month's submission can be edited." },
        { status: 403 },
      );
    }

    if (existing.status !== "pending" || existing.coachResponse) {
      return NextResponse.json(
        { error: "This submission can no longer be edited." },
        { status: 403 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.goalItem.deleteMany({
        where: { checkinId: existing.id },
      });

      return tx.goalCheckin.update({
        where: { id: existing.id },
        data: {
          monthlyFocus,
          lastMonthReview,
          focusArea,
          additionalNotes,
          goals: {
            create: normalizedGoals.map((goal) => ({
              category: goal.category,
              description: goal.description,
              targetValue: goal.targetValue,
            })),
          },
        },
        include: {
          goals: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        submissionId: updated.id,
        message: GOAL_CHECKIN_SUBMITTED_MESSAGE,
      },
      { status: 200 },
    );
  }

  const availability = await getGoalCheckinAvailability(session.user.id);
  if (!availability.canSubmit) {
    return NextResponse.json(
      { error: availability.message ?? "You cannot submit goals right now." },
      { status: 403 },
    );
  }

  const created = await prisma.goalCheckin.create({
    data: {
      userId: session.user.id,
      monthlyFocus,
      lastMonthReview,
      focusArea,
      additionalNotes,
      status: "pending",
      goals: {
        create: normalizedGoals.map((goal) => ({
          category: goal.category,
          description: goal.description,
          targetValue: goal.targetValue,
        })),
      },
    },
    include: {
      goals: true,
    },
  });

  try {
    await sendGoalCheckinSubmissionNotification({
      memberName,
      memberEmail: user.email,
      membershipTier: user.membershipTier,
      monthlyFocus,
      lastMonthReview,
      focusArea,
      additionalNotes,
      goals: created.goals.map((goal) => ({
        category: goal.category,
        description: goal.description,
        targetValue: goal.targetValue,
      })),
    });
  } catch (error) {
    console.error("Failed to send goal check-in admin notification", error);
  }

  try {
    await sendGoalCheckinReceivedEmail({
      toEmail: user.email,
      displayName: memberName,
    });
  } catch (error) {
    console.error("Failed to send goal check-in confirmation email", error);
  }

  return NextResponse.json(
    {
      success: true,
      submissionId: created.id,
      message: GOAL_CHECKIN_SUBMITTED_MESSAGE,
    },
    { status: 201 },
  );
}
