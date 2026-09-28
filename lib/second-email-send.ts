import "server-only";

import { sendSubmissionResponseEmail } from "@/lib/notifications";
import type { DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export async function sendSecondEmailCoachResponseCopy(params: {
  userId: string;
  playerName: string;
  submissionId: string | number;
  submissionType: "SWING_ANALYSIS" | "MENTAL_GAME";
  responseMode: "VIDEO" | "WRITTEN";
  membershipTier?: DatabaseTier | null;
  writtenResponse?: string;
  videoResponseUrl?: string;
  recommendedDrillIds?: string[];
}) {
  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: params.userId },
    select: {
      parentEmail: true,
      parentEmailsEnabled: true,
    },
  });

  if (!enrollment?.parentEmail?.trim() || !enrollment.parentEmailsEnabled) {
    return;
  }

  await sendSubmissionResponseEmail({
    toEmail: enrollment.parentEmail.trim(),
    playerName: params.playerName,
    submissionId: String(params.submissionId),
    submissionType: params.submissionType,
    responseMode: params.responseMode,
    membershipTier: params.membershipTier ?? undefined,
    writtenResponse: params.writtenResponse,
    videoResponseUrl: params.videoResponseUrl,
    recommendedDrillIds: params.recommendedDrillIds,
  });
}
