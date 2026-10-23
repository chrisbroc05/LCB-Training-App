/**
 * R2 video playback helpers (client-safe).
 */

export const R2_VIDEO_MAX_HEIGHT_PX = 720;

export function appendVideoPreviewTimeFragment(playbackUrl: string, seconds = 0.1): string {
  const trimmed = playbackUrl.trim();
  if (!trimmed) {
    return trimmed;
  }
  const hashIndex = trimmed.indexOf("#");
  const base = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  return `${base}#t=${seconds}`;
}
