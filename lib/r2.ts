import "server-only";

import { randomUUID } from "crypto";
import { Readable } from "stream";
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  getR2Client,
  getR2Config,
  getR2PlaybackClient,
} from "@/lib/r2-s3-client-server";
import {
  ADMIN_VIDEO_DOWNLOAD_EXPIRY_SECONDS,
  VIDEO_PLAYBACK_PRESIGNED_EXPIRY_SECONDS,
  buildVideoPosterR2Key,
  inferVideoContentTypeFromKey,
  isValidR2ObjectKey,
  sanitizeR2FileName,
} from "@/lib/r2-shared";
import { SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS } from "@/lib/submission-video-limits";

export {
  ADMIN_VIDEO_DOWNLOAD_EXPIRY_SECONDS,
  R2_VIDEO_PREFIX,
  VIDEO_PLAYBACK_PRESIGNED_EXPIRY_SECONDS,
  buildVideoPosterR2Key,
  formatR2VideoReference,
  getAdminR2VideoUrl,
  getStreamableR2VideoUrl,
  inferVideoContentTypeFromKey,
  isR2VideoReference,
  isValidR2ObjectKey,
  isVideoPosterR2Key,
  parseR2VideoReference,
} from "@/lib/r2-shared";

/** Reuse cached playback URLs until this long before expiry. */
const PLAYBACK_URL_CACHE_REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

type CachedPlaybackUrl = {
  playbackUrl: string;
  contentType: string;
  expiresAtMs: number;
};

const playbackUrlCache = new Map<string, CachedPlaybackUrl>();

function sanitizeFileName(fileName: string) {
  return sanitizeR2FileName(fileName);
}

export async function createPresignedVideoPosterUploadUrl(params: {
  videoKey: string;
  fileSize: number;
}) {
  const { bucketName } = getR2Config();
  const key = buildVideoPosterR2Key(params.videoKey);
  if (!isValidR2ObjectKey(key)) {
    throw new Error("Invalid poster key.");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: "image/jpeg",
    ContentLength: params.fileSize,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    posterR2Key: key,
    contentType: "image/jpeg",
    expiresInSeconds: SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  };
}

export async function createPresignedR2ImageUrl(key: string) {
  const { bucketName } = getR2Config();
  if (!isValidR2ObjectKey(key)) {
    throw new Error("Invalid image key.");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentType: "image/jpeg",
  });

  const imageUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: VIDEO_PLAYBACK_PRESIGNED_EXPIRY_SECONDS,
  });

  return {
    imageUrl,
    expiresInSeconds: VIDEO_PLAYBACK_PRESIGNED_EXPIRY_SECONDS,
  };
}

export function buildEvaluationPdfKey(submissionId: string) {
  return `evaluations/${submissionId}/${Date.now()}-${randomUUID()}-player-evaluation.pdf`;
}

export function isEvaluationPdfKey(key: string, submissionId: string) {
  const prefix = `evaluations/${submissionId}/`;
  return key.startsWith(prefix) && isValidR2ObjectKey(key);
}

export async function uploadEvaluationPdfBuffer(params: {
  key: string;
  pdfBuffer: Buffer;
}) {
  const { bucketName } = getR2Config();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: params.key,
      Body: params.pdfBuffer,
      ContentType: "application/pdf",
      ContentLength: params.pdfBuffer.length,
    }),
  );

  return params.key;
}

export async function createPresignedEvaluationPdfDownloadUrl(
  key: string,
  options?: { inline?: boolean },
) {
  const { bucketName } = getR2Config();
  const fileName = sanitizeFileName(key.split("/").pop() ?? "player-evaluation.pdf");
  const disposition = options?.inline
    ? `inline; filename="${fileName}"`
    : `attachment; filename="${fileName}"`;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: disposition,
    ResponseContentType: "application/pdf",
  });

  const downloadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: ADMIN_VIDEO_DOWNLOAD_EXPIRY_SECONDS,
  });

  return {
    downloadUrl,
    fileName,
    expiresInSeconds: ADMIN_VIDEO_DOWNLOAD_EXPIRY_SECONDS,
  };
}

export function buildUserSubmissionVideoKey(userId: string, fileName: string) {
  return `submissions/${userId}/${Date.now()}-${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function buildAdminResponseVideoKey(submissionId: string, fileName: string) {
  return `responses/${submissionId}/${Date.now()}-${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function buildCoachVideoKey(userId: string, fileName: string) {
  return `coach-videos/${userId}/${Date.now()}-${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function isCoachVideoKey(key: string, userId: string) {
  const prefix = `coach-videos/${userId}/`;
  return key.startsWith(prefix) && isValidR2ObjectKey(key);
}

export function isUserSubmissionVideoKey(key: string, userId: string) {
  const prefix = `submissions/${userId}/`;
  return key.startsWith(prefix) && isValidR2ObjectKey(key);
}

export function isAdminResponseVideoKey(key: string, submissionId: string) {
  const prefix = `responses/${submissionId}/`;
  return key.startsWith(prefix) && isValidR2ObjectKey(key);
}

export function isAllowedSubmissionVideoContentType(contentType: string) {
  return contentType.trim().toLowerCase().startsWith("video/");
}

export async function createPresignedCoachVideoUploadUrl(params: {
  userId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  const { bucketName } = getR2Config();
  const key = buildCoachVideoKey(params.userId, params.fileName);
  const contentType = params.contentType.trim() || "video/mp4";

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    ContentLength: params.fileSize,
    Metadata: {
      userId: params.userId,
    },
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    r2Key: key,
    contentType,
    expiresInSeconds: SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  };
}

export async function createPresignedAdminResponseVideoUploadUrl(params: {
  submissionId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  const { bucketName } = getR2Config();
  const key = buildAdminResponseVideoKey(params.submissionId, params.fileName);
  const contentType = params.contentType.trim() || "video/mp4";

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    ContentLength: params.fileSize,
    Metadata: {
      submissionId: params.submissionId,
    },
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    r2Key: key,
    contentType,
    expiresInSeconds: SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  };
}

export async function createPresignedSubmissionVideoUploadUrl(params: {
  userId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  const { bucketName } = getR2Config();
  const key = buildUserSubmissionVideoKey(params.userId, params.fileName);
  const contentType = params.contentType.trim() || "video/mp4";

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    ContentLength: params.fileSize,
    Metadata: {
      userId: params.userId,
    },
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    r2Key: key,
    contentType,
    expiresInSeconds: SUBMISSION_VIDEO_PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  };
}

export async function headR2Object(key: string) {
  const { bucketName } = getR2Config();

  return getR2Client().send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
}

export function getR2ObjectFileName(key: string) {
  return sanitizeFileName(key.split("/").pop() ?? "submission-video.mp4");
}

function resolveVideoContentType(storedContentType: string | undefined, key: string) {
  const normalized = storedContentType?.trim().toLowerCase() ?? "";
  if (normalized.startsWith("video/") && normalized !== "application/octet-stream") {
    return storedContentType!;
  }

  return inferVideoContentTypeFromKey(key);
}

export async function createPresignedR2VideoPlaybackUrl(key: string) {
  const now = Date.now();
  const cached = playbackUrlCache.get(key);
  if (cached && cached.expiresAtMs - PLAYBACK_URL_CACHE_REFRESH_BEFORE_EXPIRY_MS > now) {
    return {
      playbackUrl: cached.playbackUrl,
      contentType: cached.contentType,
      expiresInSeconds: Math.max(1, Math.floor((cached.expiresAtMs - now) / 1000)),
    };
  }

  const { bucketName } = getR2Config();
  // Presigning is local; do not HeadObject first (that was stalling pages on R2 timeouts).
  const contentType = inferVideoContentTypeFromKey(key);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentType: contentType,
  });

  const playbackUrl = await getSignedUrl(getR2PlaybackClient(), command, {
    expiresIn: VIDEO_PLAYBACK_PRESIGNED_EXPIRY_SECONDS,
  });

  playbackUrlCache.set(key, {
    playbackUrl,
    contentType,
    expiresAtMs: now + VIDEO_PLAYBACK_PRESIGNED_EXPIRY_SECONDS * 1000,
  });

  return {
    playbackUrl,
    contentType,
    expiresInSeconds: VIDEO_PLAYBACK_PRESIGNED_EXPIRY_SECONDS,
  };
}

export async function createPresignedR2VideoDownloadUrl(key: string) {
  const { bucketName } = getR2Config();
  const fileName = getR2ObjectFileName(key);
  const head = await headR2Object(key);
  const contentType = resolveVideoContentType(head.ContentType, key);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
    ResponseContentType: contentType,
  });

  const downloadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: ADMIN_VIDEO_DOWNLOAD_EXPIRY_SECONDS,
  });

  return {
    downloadUrl,
    fileName,
    contentType,
    expiresInSeconds: ADMIN_VIDEO_DOWNLOAD_EXPIRY_SECONDS,
  };
}

export async function uploadSubmissionVideoToR2(file: File) {
  const { bucketName } = getR2Config();
  const key = `submissions/${Date.now()}-${sanitizeFileName(file.name)}`;
  const contentType = file.type || "video/mp4";
  const body = Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]);

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: file.size,
    }),
  );

  return key;
}

export async function getR2ObjectStream(key: string) {
  const { bucketName } = getR2Config();

  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error("Video not found in R2.");
  }

  return {
    body: response.Body as NodeJS.ReadableStream,
    contentType: response.ContentType ?? "video/mp4",
    contentLength: response.ContentLength,
  };
}

export type R2ListedObject = {
  key: string;
  sizeBytes: number | null;
  lastModified: Date | null;
};

export async function listR2ObjectsWithPrefix(prefix: string): Promise<R2ListedObject[]> {
  const { bucketName } = getR2Config();
  const client = getR2Client();
  const objects: R2ListedObject[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key) {
        continue;
      }
      objects.push({
        key: object.Key,
        sizeBytes: object.Size ?? null,
        lastModified: object.LastModified ?? null,
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return objects;
}
