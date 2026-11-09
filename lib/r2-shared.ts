export const R2_VIDEO_PREFIX = "r2:";

export const ADMIN_VIDEO_DOWNLOAD_EXPIRY_SECONDS = 10 * 60;

export const VIDEO_PLAYBACK_PRESIGNED_EXPIRY_SECONDS = 60 * 60;

export function formatR2VideoReference(key: string) {
  return `${R2_VIDEO_PREFIX}${key}`;
}

export function parseR2VideoReference(value: string) {
  if (!value.startsWith(R2_VIDEO_PREFIX)) {
    return null;
  }

  const key = value.slice(R2_VIDEO_PREFIX.length).trim();
  return key.length > 0 ? key : null;
}

export function getStreamableR2VideoUrl(key: string) {
  return `/api/video/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function getAdminR2VideoUrl(reference: string) {
  const key = parseR2VideoReference(reference);
  if (!key) {
    return null;
  }

  return getStreamableR2VideoUrl(key);
}

export function isValidR2ObjectKey(key: string) {
  return (
    (key.startsWith("submissions/") ||
      key.startsWith("responses/") ||
      key.startsWith("coach-videos/") ||
      key.startsWith("evaluations/")) &&
    !key.includes("..")
  );
}

export function buildVideoPosterR2Key(videoKey: string): string {
  const trimmed = videoKey.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex > trimmed.lastIndexOf("/")) {
    return `${trimmed.slice(0, dotIndex)}.poster.jpg`;
  }
  return `${trimmed}.poster.jpg`;
}

export function isVideoPosterR2Key(key: string, videoKey: string) {
  return key === buildVideoPosterR2Key(videoKey) && isValidR2ObjectKey(key);
}

export function isR2VideoReference(value: string) {
  return parseR2VideoReference(value) !== null;
}

export function sanitizeR2FileName(fileName: string) {
  const baseName = fileName.split(/[/\\]/).pop() ?? "submission-video.mp4";
  const sanitized = baseName.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "submission-video.mp4";
}

export function inferVideoContentTypeFromKey(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  const contentTypeByExtension: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    m4v: "video/mp4",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    ogv: "video/ogg",
  };

  return contentTypeByExtension[extension] ?? "video/mp4";
}
