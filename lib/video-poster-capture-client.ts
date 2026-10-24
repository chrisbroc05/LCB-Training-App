"use client";

/**
 * Capture a JPEG poster frame from a local or remote video (browser only).
 */

import { VIDEO_POSTER_CAPTURE_TIMEOUT_MS } from "@/lib/video-poster-capture-shared";

const POSTER_SEEK_SECONDS = 1;
const POSTER_JPEG_QUALITY = 0.85;
const POSTER_MAX_WIDTH = 1280;

function loadVideoMetadata(
  video: HTMLVideoElement,
  source: File | string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const objectUrl = typeof source === "string" ? null : URL.createObjectURL(source);
    const src = typeof source === "string" ? source : objectUrl!;

    const cleanup = () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    const onLoaded = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Unable to load video for poster capture."));
    };

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = typeof source === "string" ? "anonymous" : null;
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("error", onError);
    video.src = src;
  });
}

export async function captureVideoPosterJpegBlob(
  source: File | string,
  seekSeconds = POSTER_SEEK_SECONDS,
): Promise<Blob | null> {
  if (typeof document === "undefined") {
    return null;
  }

  const video = document.createElement("video");
  try {
    await loadVideoMetadata(video, source);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const targetTime =
      duration > seekSeconds + 0.05 ? seekSeconds : Math.max(0, duration > 0 ? duration * 0.1 : 0);

    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        reject(new Error("Unable to seek video for poster capture."));
      };
      video.addEventListener("seeked", onSeeked);
      video.addEventListener("error", onError);
      video.currentTime = targetTime;
    });

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      return null;
    }

    const scale = width > POSTER_MAX_WIDTH ? POSTER_MAX_WIDTH / width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", POSTER_JPEG_QUALITY);
    });
    return blob;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}

async function withPosterCaptureTimeout<T>(promise: Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), VIDEO_POSTER_CAPTURE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function uploadVideoPosterForR2Key(params: {
  videoR2Key: string;
  source: File | string;
  uploadUrlPath?: string;
}): Promise<string | null> {
  const blob = await withPosterCaptureTimeout(captureVideoPosterJpegBlob(params.source));
  if (!blob) {
    return null;
  }

  const uploadUrlPath = params.uploadUrlPath ?? "/api/video-poster/upload-url";
  const presignResponse = await fetch(uploadUrlPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoR2Key: params.videoR2Key,
      fileSize: blob.size,
    }),
  });

  if (!presignResponse.ok) {
    return null;
  }

  const presigned = (await presignResponse.json()) as {
    uploadUrl: string;
    posterR2Key: string;
    contentType: string;
  };

  const putResponse = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": presigned.contentType },
    body: blob,
  });

  if (!putResponse.ok) {
    return null;
  }

  return presigned.posterR2Key;
}
