import { prisma } from "@/lib/prisma";
import {
  formatR2VideoReference,
  isCoachVideoKey,
  isUserSubmissionVideoKey,
  isValidR2ObjectKey,
  parseR2VideoReference,
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

  if (isCoachVideoKey(key, userId)) {
    const count = await prisma.coachVideo.count({
      where: { userId, videoKey: key },
    });
    return count > 0;
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

  if (key.startsWith("submissions/")) {
    const reference = formatR2VideoReference(key);
    if (reference) {
      return userCanAccessR2VideoReference(userId, reference);
    }
  }

  return false;
}

export async function adminCanAccessR2VideoKey(key: string): Promise<boolean> {
  if (!isValidR2ObjectKey(key)) {
    return false;
  }

  const coachCount = await prisma.coachVideo.count({
    where: { videoKey: key },
  });
  if (coachCount > 0) {
    return true;
  }

  const reference = formatR2VideoReference(key);
  if (reference) {
    const [swingSubmitted, swingResponse, mentalSubmitted, mentalResponse] = await Promise.all([
      prisma.swingAnalysisSubmission.count({ where: { submittedVideo: reference } }),
      prisma.swingAnalysisSubmission.count({ where: { responseVideoUrl: reference } }),
      prisma.mentalGameSubmission.count({ where: { videoPath: reference } }),
      prisma.mentalGameSubmission.count({ where: { responseVideoUrl: reference } }),
    ]);
    if (swingSubmitted + swingResponse + mentalSubmitted + mentalResponse > 0) {
      return true;
    }
  }

  if (key.startsWith("responses/")) {
    const parts = key.split("/");
    const submissionId = parts[1];
    if (submissionId) {
      const [swingCount, mentalCount] = await Promise.all([
        prisma.swingAnalysisSubmission.count({ where: { id: submissionId } }),
        prisma.mentalGameSubmission.count({ where: { id: submissionId } }),
      ]);
      return swingCount + mentalCount > 0;
    }
  }

  if (key.startsWith("submissions/")) {
    const parts = key.split("/");
    const userId = parts[1];
    if (userId) {
      const userCount = await prisma.user.count({ where: { id: userId } });
      return userCount > 0;
    }
  }

  return false;
}

export function normalizeStoredVideoToR2Key(stored: string | null | undefined) {
  if (!stored?.trim()) {
    return null;
  }
  const parsed = parseR2VideoReference(stored);
  if (parsed) {
    return parsed;
  }
  const trimmed = stored.trim();
  return isValidR2ObjectKey(trimmed) ? trimmed : null;
}
