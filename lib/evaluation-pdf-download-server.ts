import "server-only";

import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  createPresignedEvaluationPdfDownloadUrl,
  isEvaluationPdfKey,
} from "@/lib/r2";

export async function resolveEvaluationPdfPresignedDownloadUrl(params: {
  submissionId: string;
  userId: string;
  userEmail?: string | null;
}) {
  const submission = await prisma.swingAnalysisSubmission.findUnique({
    where: { id: params.submissionId },
    select: {
      userId: true,
      evaluationPdfR2Key: true,
      status: true,
    },
  });

  if (!submission?.evaluationPdfR2Key) {
    return { ok: false as const, status: 404, error: "Evaluation PDF not found." };
  }

  const isOwner = submission.userId === params.userId;
  const isAdmin = params.userEmail ? isAdminEmail(params.userEmail) : false;
  if (!isOwner && !isAdmin) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  if (
    submission.status !== "COMPLETED" ||
    !isEvaluationPdfKey(submission.evaluationPdfR2Key, params.submissionId)
  ) {
    return { ok: false as const, status: 404, error: "Evaluation PDF not available." };
  }

  const { downloadUrl, expiresInSeconds } = await createPresignedEvaluationPdfDownloadUrl(
    submission.evaluationPdfR2Key,
  );

  return { ok: true as const, downloadUrl, expiresInSeconds };
}
