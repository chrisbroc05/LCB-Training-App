import { prisma } from "@/lib/prisma";
import {
  formatR2VideoReference,
  isUserSubmissionVideoKey,
  isValidR2ObjectKey,
} from "@/lib/r2";

export async function userCanAccessR2VideoReference(
  userId: string,
  reference: string,
): Promise<boolean> {
  const [swingSubmitted, swingResponse, mentalSubmitted, mentalResponse] = await Promise.all([
    prisma.swingAnalysisSubmission.count({
      where: { userId, submittedVideo: reference },
    }),
    prisma.swingAnalysisSubmission.count({
      where: { userId, responseVideoUrl: reference },
    }),
    prisma.mentalGameSubmission.count({
      where: { userId, videoPath: reference },
    }),
    prisma.mentalGameSubmission.count({
      where: { userId, responseVideoUrl: reference },
    }),
  ]);

  return swingSubmitted + swingResponse + mentalSubmitted + mentalResponse > 0;
}

export async function userCanAccessR2VideoKey(
  userId: string,
  key: string,
): Promise<boolean> {
  if (!isValidR2ObjectKey(key)) {
    return false;
  }

  if (isUserSubmissionVideoKey(key, userId)) {
    return true;
  }

  if (key.startsWith("responses/")) {
    const parts = key.split("/");
    if (parts.length >= 3 && parts[1]) {
      const submissionId = parts[1];
      const [swingCount, mentalCount] = await Promise.all([
        prisma.swingAnalysisSubmission.count({
          where: { id: submissionId, userId },
        }),
        prisma.mentalGameSubmission.count({
          where: { id: submissionId, userId },
        }),
      ]);

      if (swingCount + mentalCount > 0) {
        return true;
      }
    }

    return userCanAccessR2VideoReference(userId, formatR2VideoReference(key));
  }

  return false;
}
