import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const MAX_SUBMISSION_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB
export const EMAIL_VIDEO_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const TEMP_VIDEO_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const VIDEO_UPLOADS_DIR = path.join(process.cwd(), ".uploads", "submission-videos");
const DEFAULT_BASE_URL = "http://localhost:3000";

function getLinkSecret() {
  const secret = process.env.SUBMISSION_VIDEO_LINK_SECRET ?? process.env.NEXTAUTH_SECRET;
  return secret || "lcb-training-dev-video-secret";
}

function getSafeExtension(fileName: string, mimeType: string) {
  const extFromName = path.extname(fileName).toLowerCase();
  if (/^\.[a-z0-9]{1,10}$/.test(extFromName)) {
    return extFromName;
  }

  const mimeMap: Record<string, string> = {
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/x-msvideo": ".avi",
    "video/x-matroska": ".mkv",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
  };

  return mimeMap[mimeType.toLowerCase()] ?? ".mp4";
}

export function getSubmissionVideoUrl(videoId: string) {
  return `/api/submission-videos/${encodeURIComponent(videoId)}`;
}

export function getSubmissionVideoAbsoluteUrl(videoId: string) {
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
  return `${baseUrl}${getSubmissionVideoUrl(videoId)}`;
}

export function isValidVideoId(videoId: string) {
  return /^[A-Za-z0-9._-]{1,160}$/.test(videoId) && !videoId.includes("..");
}

export function resolveSubmissionVideoPath(videoId: string) {
  if (!isValidVideoId(videoId)) {
    throw new Error("Invalid video id.");
  }

  return path.join(VIDEO_UPLOADS_DIR, videoId);
}

function signVideoToken(videoId: string, expiresAtUnix: number) {
  return createHmac("sha256", getLinkSecret())
    .update(`${videoId}:${expiresAtUnix}`)
    .digest("hex");
}

export function verifyVideoToken(videoId: string, expiresAtUnix: number, token: string) {
  if (!Number.isFinite(expiresAtUnix) || expiresAtUnix <= 0 || !token) {
    return false;
  }

  if (Math.floor(Date.now() / 1000) > expiresAtUnix) {
    return false;
  }

  const expectedToken = signVideoToken(videoId, expiresAtUnix);
  const provided = Buffer.from(token);
  const expected = Buffer.from(expectedToken);
  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

export function createTemporaryVideoDownloadLink(videoId: string, ttlMs = TEMP_VIDEO_LINK_TTL_MS) {
  const expiresAtUnix = Math.floor((Date.now() + ttlMs) / 1000);
  const token = signVideoToken(videoId, expiresAtUnix);
  const url = `${getSubmissionVideoAbsoluteUrl(videoId)}?expires=${expiresAtUnix}&token=${token}&download=1`;

  return {
    url,
    expiresAt: new Date(expiresAtUnix * 1000),
    expiresAtUnix,
  };
}

export function getMimeTypeFromVideoId(videoId: string) {
  const ext = path.extname(videoId).toLowerCase();
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
  };
  return map[ext] ?? "application/octet-stream";
}

export async function persistSubmissionVideoFile(file: File) {
  const extension = getSafeExtension(file.name ?? "", file.type ?? "");
  const videoId = `${randomUUID()}${extension}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await mkdir(VIDEO_UPLOADS_DIR, { recursive: true });
  const filePath = resolveSubmissionVideoPath(videoId);
  await writeFile(filePath, fileBuffer);

  return {
    videoId,
    fileBuffer,
    mimeType: file.type || getMimeTypeFromVideoId(videoId),
    originalFileName: file.name || `submission-video${extension}`,
    sizeBytes: fileBuffer.byteLength,
    relativeUrl: getSubmissionVideoUrl(videoId),
  };
}

export async function readSubmissionVideoFile(videoId: string) {
  const filePath = resolveSubmissionVideoPath(videoId);
  const fileBuffer = await readFile(filePath);
  return {
    fileBuffer,
    mimeType: getMimeTypeFromVideoId(videoId),
    filePath,
  };
}
