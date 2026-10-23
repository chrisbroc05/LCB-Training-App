import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getFreeSwingAnalysisResponseMode } from "@/lib/free-swing-analysis-response-server";
import { getReportsQueueReviewTracks } from "@/lib/reports-queue-shared";

type SubmissionType = "swing" | "mental";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "swing") as SubmissionType;

  if (type === "mental") {
    const submissions = await prisma.mentalGameSubmission.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        playerName: true,
        topic: true,
        createdAt: true,
        userEmail: true,
        status: true,
        memberVimeoLink: true,
        user: { select: { programEnrollment: { select: { id: true } } } },
      },
    });

    return NextResponse.json({
      submissions: submissions.map((submission) => ({
        id: submission.id,
        playerName: submission.playerName,
        topic: submission.topic,
        createdAt: submission.createdAt,
        userEmail: submission.userEmail,
        status: submission.status,
        enrollmentId: submission.user.programEnrollment?.id ?? null,
        badgeStatus: submission.status === "PENDING" ? "PENDING" : "RESPONDED",
        hasMemberVimeoLink: Boolean(submission.memberVimeoLink),
      })),
    });
  }

  const freeSwingMode = await getFreeSwingAnalysisResponseMode();
  const reportsQueueTracks = getReportsQueueReviewTracks(freeSwingMode);

  const submissions = await prisma.swingAnalysisSubmission.findMany({
    where: {
      OR: [
        { reviewTrack: null },
        { reviewTrack: { notIn: reportsQueueTracks } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      playerName: true,
      createdAt: true,
      userEmail: true,
      status: true,
      memberVimeoLink: true,
      user: { select: { programEnrollment: { select: { id: true } } } },
    },
  });

  return NextResponse.json({
    submissions: submissions.map((submission) => ({
      id: submission.id,
      playerName: submission.playerName,
      createdAt: submission.createdAt,
      userEmail: submission.userEmail,
      status: submission.status,
      enrollmentId: submission.user.programEnrollment?.id ?? null,
      badgeStatus: submission.status === "PENDING" ? "PENDING" : "RESPONDED",
      hasMemberVimeoLink: Boolean(submission.memberVimeoLink),
    })),
  });
}
