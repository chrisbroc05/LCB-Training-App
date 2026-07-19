import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getGoalCheckinAvailability,
  isGoalFocusArea,
} from "@/lib/goal-check-in";
import { canAccessCoachingNav } from "@/lib/membership";
import {
  sendGoalCheckinReceivedEmail,
  sendGoalCheckinSubmissionNotification,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type SubmitBody = {
  monthlyFocus?: string;
  lastMonthReview?: string;
  focusArea?: string;
  additionalNotes?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      membershipTier: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canAccessCoachingNav(user.membershipTier)) {
    return NextResponse.json(
      { error: "Goal check-ins are available on Memorable and Elite memberships." },
      { status: 403 },
    );
  }

  const availability = await getGoalCheckinAvailability(session.user.id);
  if (!availability.canSubmit) {
    return NextResponse.json(
      { error: availability.message ?? "You cannot submit goals right now." },
      { status: 403 },
    );
  }

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

  if (!monthlyFocus || !lastMonthReview || !focusArea) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  if (!isGoalFocusArea(focusArea)) {
    return NextResponse.json({ error: "Please select a valid focus area." }, { status: 400 });
  }

  const memberName = user.name?.trim() || user.email;

  const created = await prisma.goalCheckin.create({
    data: {
      userId: session.user.id,
      monthlyFocus,
      lastMonthReview,
      focusArea,
      additionalNotes,
      status: "pending",
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
      message:
        "Your goals have been submitted. Coach Broc will review them and get back to you within 48 hours.",
    },
    { status: 201 },
  );
}
