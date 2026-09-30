import "server-only";

import type { CoachVideoDrillCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  headR2Object,
  isAllowedSubmissionVideoContentType,
  isCoachVideoKey,
  parseR2VideoReference,
} from "@/lib/r2";
import { MAX_ADMIN_RESPONSE_VIDEO_BYTES } from "@/lib/submission-video-limits";
import {
  parseCoachVideoDrillCategory,
  validateCoachVideoNote,
  validateCoachVideoTitle,
  type AdminCoachVideoSummary,
  type CoachVideoDrillCategoryValue,
  type CoachVideoListItem,
} from "@/lib/coach-video-shared";

export type CreateCoachVideoInput = {
  userId: string;
  enrollmentId?: string | null;
  title: string;
  note?: string;
  videoKey: string;
  videoContentType: string;
  videoSizeBytes: number;
  drillCategory?: string | null;
};

function serializeAdminCoachVideo(video: {
  id: string;
  title: string;
  createdAt: Date;
  viewedAt: Date | null;
  drillCategory: CoachVideoDrillCategory | null;
}): AdminCoachVideoSummary {
  return {
    id: video.id,
    title: video.title,
    createdAt: video.createdAt.toISOString(),
    viewedAt: video.viewedAt?.toISOString() ?? null,
    drillCategory: video.drillCategory,
  };
}

export async function listAdminCoachVideosForUser(userId: string) {
  const videos = await prisma.coachVideo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      viewedAt: true,
      drillCategory: true,
    },
  });

  return videos.map(serializeAdminCoachVideo);
}

export async function getUnwatchedCoachVideoCount(userId: string) {
  return prisma.coachVideo.count({
    where: {
      userId,
      viewedAt: null,
    },
  });
}

export async function validateCoachVideoUploadInput(input: CreateCoachVideoInput) {
  const titleError = validateCoachVideoTitle(input.title);
  if (titleError) {
    return titleError;
  }

  const noteError = validateCoachVideoNote(input.note ?? "");
  if (noteError) {
    return noteError;
  }

  if (!isCoachVideoKey(input.videoKey, input.userId)) {
    return "Invalid video key for this player.";
  }

  if (!isAllowedSubmissionVideoContentType(input.videoContentType)) {
    return "Only video files can be uploaded.";
  }

  if (
    !Number.isInteger(input.videoSizeBytes) ||
    input.videoSizeBytes <= 0 ||
    input.videoSizeBytes > MAX_ADMIN_RESPONSE_VIDEO_BYTES
  ) {
    return "Video file is too large. Maximum size is 2GB.";
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });

  if (!user) {
    return "Player not found.";
  }

  if (input.enrollmentId) {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: { id: input.enrollmentId },
      select: { userId: true },
    });

    if (!enrollment || enrollment.userId !== input.userId) {
      return "Enrollment does not match this player.";
    }
  }

  try {
    const head = await headR2Object(input.videoKey);
    const storedSize = head.ContentLength ?? 0;
    if (storedSize > MAX_ADMIN_RESPONSE_VIDEO_BYTES) {
      return "Video file is too large. Maximum size is 2GB.";
    }

    const storedType = head.ContentType?.trim().toLowerCase() ?? "";
    if (storedType && !storedType.startsWith("video/")) {
      return "Only video files can be uploaded.";
    }
  } catch {
    return "Uploaded video was not found. Try uploading again.";
  }

  return null;
}

export async function createCoachVideoRecord(input: CreateCoachVideoInput) {
  const validationError = await validateCoachVideoUploadInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  return prisma.coachVideo.create({
    data: {
      userId: input.userId,
      enrollmentId: input.enrollmentId ?? null,
      title: input.title.trim(),
      note: input.note?.trim() || null,
      videoKey: input.videoKey,
      videoContentType: input.videoContentType.trim() || "video/mp4",
      videoSizeBytes: input.videoSizeBytes,
      drillCategory: parseCoachVideoDrillCategory(input.drillCategory) as CoachVideoDrillCategory | null,
    },
  });
}

export async function markCoachVideoViewed(userId: string, coachVideoId: string) {
  const video = await prisma.coachVideo.findFirst({
    where: { id: coachVideoId, userId },
    select: { id: true, viewedAt: true },
  });

  if (!video) {
    return null;
  }

  if (video.viewedAt) {
    return video.viewedAt;
  }

  const updated = await prisma.coachVideo.update({
    where: { id: coachVideoId },
    data: { viewedAt: new Date() },
    select: { viewedAt: true },
  });

  return updated.viewedAt;
}

function resolveSubmissionResponseVideoKey(reference: string | null | undefined) {
  if (!reference?.trim()) {
    return null;
  }

  const parsed = parseR2VideoReference(reference);
  if (parsed) {
    return parsed;
  }

  return null;
}

export async function listPlayerVideos(userId: string): Promise<CoachVideoListItem[]> {
  const [coachVideos, swingResponses, mentalResponses] = await Promise.all([
    prisma.coachVideo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        note: true,
        createdAt: true,
        viewedAt: true,
        videoKey: true,
        drillCategory: true,
      },
    }),
    prisma.swingAnalysisSubmission.findMany({
      where: {
        userId,
        status: "COMPLETED",
        responseVideoUrl: { not: null },
        respondedAt: { not: null },
      },
      orderBy: { respondedAt: "desc" },
      select: {
        id: true,
        playerName: true,
        respondedAt: true,
        responseVideoUrl: true,
      },
    }),
    prisma.mentalGameSubmission.findMany({
      where: {
        userId,
        status: "COMPLETED",
        responseVideoUrl: { not: null },
        respondedAt: { not: null },
      },
      orderBy: { respondedAt: "desc" },
      select: {
        id: true,
        playerName: true,
        topic: true,
        respondedAt: true,
        responseVideoUrl: true,
      },
    }),
  ]);

  const items: CoachVideoListItem[] = coachVideos.map((video) => ({
    id: video.id,
    source: "coach_video",
    title: video.title,
    note: video.note,
    createdAt: video.createdAt.toISOString(),
    viewedAt: video.viewedAt?.toISOString() ?? null,
    videoKey: video.videoKey,
    drillCategory: video.drillCategory as CoachVideoDrillCategoryValue | null,
    submissionType: null,
    submissionId: null,
  }));

  for (const submission of swingResponses) {
    const videoKey = resolveSubmissionResponseVideoKey(submission.responseVideoUrl);
    if (!videoKey || !submission.respondedAt) {
      continue;
    }

    items.push({
      id: `swing-${submission.id}`,
      source: "submission_response",
      title: "Coach response: Swing analysis",
      note: null,
      createdAt: submission.respondedAt.toISOString(),
      viewedAt: submission.respondedAt.toISOString(),
      videoKey,
      drillCategory: null,
      submissionType: "SWING",
      submissionId: submission.id,
    });
  }

  for (const submission of mentalResponses) {
    const videoKey = resolveSubmissionResponseVideoKey(submission.responseVideoUrl);
    if (!videoKey || !submission.respondedAt) {
      continue;
    }

    items.push({
      id: `mental-${submission.id}`,
      source: "submission_response",
      title: "Coach response: Mindset support",
      note: null,
      createdAt: submission.respondedAt.toISOString(),
      viewedAt: submission.respondedAt.toISOString(),
      videoKey,
      drillCategory: "MINDSET",
      submissionType: "MENTAL",
      submissionId: submission.id,
    });
  }

  return items.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getPlayerVideoById(userId: string, videoId: string) {
  const items = await listPlayerVideos(userId);
  return items.find((item) => item.id === videoId) ?? null;
}

export async function countCoachVideosForUserInRange(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return prisma.coachVideo.count({
    where: {
      userId,
      createdAt: {
        gte: rangeStart,
        lt: rangeEnd,
      },
    },
  });
}
