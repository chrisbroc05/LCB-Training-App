import "server-only";

import { prisma } from "@/lib/prisma";
import { parseStoredVideoR2Key } from "@/lib/video-poster-server";

export type VideoPosterBackfillItem = {
  targetType:
    | "swing_submitted"
    | "swing_response"
    | "mental_submitted"
    | "mental_response"
    | "coach_video";
  id: string;
  videoR2Key: string;
  label: string;
};

const BATCH_LIMIT = 25;

export async function listVideoPosterBackfillBatch(): Promise<VideoPosterBackfillItem[]> {
  const items: VideoPosterBackfillItem[] = [];

  const swingSubmitted = await prisma.swingAnalysisSubmission.findMany({
    where: { submittedVideoPosterR2Key: null },
    select: { id: true, playerName: true, submittedVideo: true },
    orderBy: { createdAt: "desc" },
    take: BATCH_LIMIT,
  });

  for (const row of swingSubmitted) {
    const videoR2Key = parseStoredVideoR2Key(row.submittedVideo);
    if (videoR2Key) {
      items.push({
        targetType: "swing_submitted",
        id: row.id,
        videoR2Key,
        label: `${row.playerName} swing submission`,
      });
    }
  }

  if (items.length >= BATCH_LIMIT) {
    return items.slice(0, BATCH_LIMIT);
  }

  const swingResponse = await prisma.swingAnalysisSubmission.findMany({
    where: {
      responseVideoPosterR2Key: null,
      responseVideoUrl: { not: null },
    },
    select: { id: true, playerName: true, responseVideoUrl: true },
    orderBy: { respondedAt: "desc" },
    take: BATCH_LIMIT,
  });

  for (const row of swingResponse) {
    const videoR2Key = parseStoredVideoR2Key(row.responseVideoUrl);
    if (videoR2Key) {
      items.push({
        targetType: "swing_response",
        id: row.id,
        videoR2Key,
        label: `${row.playerName} swing response`,
      });
    }
  }

  if (items.length >= BATCH_LIMIT) {
    return items.slice(0, BATCH_LIMIT);
  }

  const mentalSubmitted = await prisma.mentalGameSubmission.findMany({
    where: { submittedVideoPosterR2Key: null, videoPath: { not: null } },
    select: { id: true, playerName: true, videoPath: true },
    orderBy: { createdAt: "desc" },
    take: BATCH_LIMIT,
  });

  for (const row of mentalSubmitted) {
    const videoR2Key = parseStoredVideoR2Key(row.videoPath);
    if (videoR2Key) {
      items.push({
        targetType: "mental_submitted",
        id: row.id,
        videoR2Key,
        label: `${row.playerName} mental submission`,
      });
    }
  }

  if (items.length >= BATCH_LIMIT) {
    return items.slice(0, BATCH_LIMIT);
  }

  const mentalResponse = await prisma.mentalGameSubmission.findMany({
    where: {
      responseVideoPosterR2Key: null,
      responseVideoUrl: { not: null },
    },
    select: { id: true, playerName: true, responseVideoUrl: true },
    orderBy: { respondedAt: "desc" },
    take: BATCH_LIMIT,
  });

  for (const row of mentalResponse) {
    const videoR2Key = parseStoredVideoR2Key(row.responseVideoUrl);
    if (videoR2Key) {
      items.push({
        targetType: "mental_response",
        id: row.id,
        videoR2Key,
        label: `${row.playerName} mental response`,
      });
    }
  }

  if (items.length >= BATCH_LIMIT) {
    return items.slice(0, BATCH_LIMIT);
  }

  const coachVideos = await prisma.coachVideo.findMany({
    where: { posterR2Key: null },
    select: { id: true, title: true, videoKey: true },
    orderBy: { createdAt: "desc" },
    take: BATCH_LIMIT,
  });

  for (const row of coachVideos) {
    items.push({
      targetType: "coach_video",
      id: row.id,
      videoR2Key: row.videoKey,
      label: row.title,
    });
  }

  return items.slice(0, BATCH_LIMIT);
}

export async function applyVideoPosterBackfillRecord(params: {
  targetType: VideoPosterBackfillItem["targetType"];
  id: string;
  posterR2Key: string;
}) {
  switch (params.targetType) {
    case "swing_submitted":
      await prisma.swingAnalysisSubmission.update({
        where: { id: params.id },
        data: { submittedVideoPosterR2Key: params.posterR2Key },
      });
      return;
    case "swing_response":
      await prisma.swingAnalysisSubmission.update({
        where: { id: params.id },
        data: { responseVideoPosterR2Key: params.posterR2Key },
      });
      return;
    case "mental_submitted":
      await prisma.mentalGameSubmission.update({
        where: { id: params.id },
        data: { submittedVideoPosterR2Key: params.posterR2Key },
      });
      return;
    case "mental_response":
      await prisma.mentalGameSubmission.update({
        where: { id: params.id },
        data: { responseVideoPosterR2Key: params.posterR2Key },
      });
      return;
    case "coach_video":
      await prisma.coachVideo.update({
        where: { id: params.id },
        data: { posterR2Key: params.posterR2Key },
      });
      return;
    default:
      throw new Error("Invalid target type.");
  }
}
