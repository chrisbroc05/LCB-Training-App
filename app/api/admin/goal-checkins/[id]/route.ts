import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { formatGoalFocusAreaLabel, serializeGoalItem } from "@/lib/goal-check-in-constants";
import { memberProfileSelect, serializeMemberProfile } from "@/lib/player-profile";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = await context.params;
  const submissionId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(submissionId)) {
    return NextResponse.json({ error: "Invalid submission id." }, { status: 400 });
  }

  const submission = await prisma.goalCheckin.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          membershipTier: true,
          ...memberProfileSelect,
        },
      },
      goals: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    submission: {
      id: submission.id,
      playerName: submission.user.name?.trim() || submission.user.email,
      userEmail: submission.user.email,
      membershipTier: submission.user.membershipTier,
      monthlyFocus: submission.monthlyFocus,
      lastMonthReview: submission.lastMonthReview,
      focusArea: submission.focusArea,
      focusAreaLabel: formatGoalFocusAreaLabel(submission.focusArea),
      additionalNotes: submission.additionalNotes,
      coachResponse: submission.coachResponse,
      status: submission.status,
      badgeStatus: submission.status === "pending" ? "PENDING" : "RESPONDED",
      createdAt: submission.createdAt.toISOString(),
      respondedAt: submission.respondedAt?.toISOString() ?? null,
      goals: submission.goals.map(serializeGoalItem),
      memberProfile: serializeMemberProfile(submission.user),
    },
  });
}
