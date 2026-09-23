import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { parseAssessmentCallDateTime } from "@/lib/assessment-call";
import { prisma } from "@/lib/prisma";

type MarkCallBookedBody = {
  userId?: string;
  callDate?: string;
  callTime?: string;
  callType?: "assessment" | "twelve_week";
  clear?: boolean;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: MarkCallBookedBody;
  try {
    body = (await request.json()) as MarkCallBookedBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const callType = body.callType === "twelve_week" ? "twelve_week" : "assessment";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, membershipTier: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (callType === "assessment" && user.membershipTier !== "FREE") {
    return NextResponse.json(
      { error: "Assessment call booking is only available for Free tier members." },
      { status: 400 },
    );
  }

  if (callType === "twelve_week" && user.membershipTier !== "TWELVE_WEEK") {
    return NextResponse.json(
      { error: "Scheduled call management is only available for 12-Week Program members." },
      { status: 400 },
    );
  }

  if (body.clear) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data:
        callType === "twelve_week"
          ? {
              twelveWeekCallBooked: false,
              twelveWeekCallScheduledAt: null,
            }
          : {
              assessmentCallBooked: false,
              assessmentCallDate: null,
            },
      select: {
        id: true,
        assessmentCallBooked: true,
        assessmentCallDate: true,
        twelveWeekCallBooked: true,
        twelveWeekCallScheduledAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        assessmentCallDate: updatedUser.assessmentCallDate?.toISOString() ?? null,
        twelveWeekCallScheduledAt: updatedUser.twelveWeekCallScheduledAt?.toISOString() ?? null,
      },
    });
  }

  const callDate = body.callDate?.trim();
  const callTime = body.callTime?.trim();

  if (!callDate || !callTime) {
    return NextResponse.json(
      { error: "callDate and callTime are required." },
      { status: 400 },
    );
  }

  const scheduledAt = parseAssessmentCallDateTime(callDate, callTime);
  if (!scheduledAt) {
    return NextResponse.json({ error: "Invalid call date or time." }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data:
      callType === "twelve_week"
        ? {
            twelveWeekCallBooked: true,
            twelveWeekCallScheduledAt: scheduledAt,
          }
        : {
            assessmentCallBooked: true,
            assessmentCallDate: scheduledAt,
          },
    select: {
      id: true,
      assessmentCallBooked: true,
      assessmentCallDate: true,
      twelveWeekCallBooked: true,
      twelveWeekCallScheduledAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    user: {
      ...updatedUser,
      assessmentCallDate: updatedUser.assessmentCallDate?.toISOString() ?? null,
      twelveWeekCallScheduledAt: updatedUser.twelveWeekCallScheduledAt?.toISOString() ?? null,
    },
  });
}
