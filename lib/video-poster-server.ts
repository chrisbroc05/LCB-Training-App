import "server-only";

import {
  buildVideoPosterR2Key,
  headR2Object,
  isVideoPosterR2Key,
  parseR2VideoReference,
} from "@/lib/r2";

export function parseStoredVideoR2Key(stored: string | null | undefined): string | null {
  if (!stored?.trim()) {
    return null;
  }
  const trimmed = stored.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return null;
  }
  return parseR2VideoReference(trimmed) ?? (trimmed.includes("/") ? trimmed : null);
}

export async function validateVideoPosterR2Key(
  videoR2Key: string,
  posterR2Key: string,
): Promise<string | null> {
  if (!isVideoPosterR2Key(posterR2Key, videoR2Key)) {
    return "Invalid poster reference for this video.";
  }

  try {
    await headR2Object(posterR2Key);
  } catch {
    return "Poster image was not found. Try uploading again.";
  }

  return null;
}

export function expectedPosterKeyForVideo(videoR2Key: string): string {
  return buildVideoPosterR2Key(videoR2Key);
}
