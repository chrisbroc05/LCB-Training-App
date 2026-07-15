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
  const callDate = body.callDate?.trim();
  const callTime = body.callTime?.trim();

  if (!userId || !callDate || !callTime) {
    return NextResponse.json(
      { error: "userId, callDate, and callTime are required." },
      { status: 400 },
    );
  }

  const assessmentCallDate = parseAssessmentCallDateTime(callDate, callTime);
  if (!assessmentCallDate) {
    return NextResponse.json({ error: "Invalid call date or time." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, membershipTier: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.membershipTier !== "FREE") {
    return NextResponse.json(
      { error: "Assessment call booking is only available for Free tier members." },
      { status: 400 },
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      assessmentCallBooked: true,
      assessmentCallDate,
    },
    select: {
      id: true,
      assessmentCallBooked: true,
      assessmentCallDate: true,
    },
  });

  return NextResponse.json({
    success: true,
    user: {
      ...updatedUser,
      assessmentCallDate: updatedUser.assessmentCallDate?.toISOString() ?? null,
    },
  });
}
