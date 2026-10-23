import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  createPresignedEvaluationPdfDownloadUrl,
  isEvaluationPdfKey,
} from "@/lib/r2";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissionId = new URL(request.url).searchParams.get("submissionId")?.trim();
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required." }, { status: 400 });
  }

  const submission = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: submissionId },
    select: {
      userId: true,
      evaluationPdfR2Key: true,
      status: true,
    },
  });

  if (!submission?.evaluationPdfR2Key) {
    return NextResponse.json({ error: "Evaluation PDF not found." }, { status: 404 });
  }

  const isOwner = submission.userId === session.user.id;
  const isAdmin = isAdminEmail(session.user.email);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    submission.status !== "COMPLETED" ||
    !isEvaluationPdfKey(submission.evaluationPdfR2Key, submissionId)
  ) {
    return NextResponse.json({ error: "Evaluation PDF not available." }, { status: 404 });
  }

  const { downloadUrl, expiresInSeconds } = await createPresignedEvaluationPdfDownloadUrl(
    submission.evaluationPdfR2Key,
  );

  return NextResponse.json({ downloadUrl, expiresInSeconds });
}
