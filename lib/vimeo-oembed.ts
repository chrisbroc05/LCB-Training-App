import { extractVimeoVideoId } from "@/lib/drill-library-videos";

type ThumbnailCacheEntry = {
  thumbnailUrl: string | null;
  expiresAt: number;
};

const THUMBNAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const thumbnailCache = new Map<string, ThumbnailCacheEntry>();

type VimeoOEmbedResponse = {
  thumbnail_url?: string;
};

export async function fetchVimeoThumbnailUrl(videoUrl: string): Promise<string | null> {
  const videoId = extractVimeoVideoId(videoUrl);
  if (!videoId) {
    return null;
  }

  const cached = thumbnailCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.thumbnailUrl;
  }

  const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
    `https://vimeo.com/${videoId}`,
  )}`;

  try {
    const response = await fetch(oEmbedUrl, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      thumbnailCache.set(videoId, {
        thumbnailUrl: null,
        expiresAt: Date.now() + THUMBNAIL_CACHE_TTL_MS,
      });
      return null;
    }

    const payload = (await response.json()) as VimeoOEmbedResponse;
    const thumbnailUrl = payload.thumbnail_url ?? null;

    thumbnailCache.set(videoId, {
      thumbnailUrl,
      expiresAt: Date.now() + THUMBNAIL_CACHE_TTL_MS,
    });

    return thumbnailUrl;
  } catch {
    thumbnailCache.set(videoId, {
      thumbnailUrl: null,
      expiresAt: Date.now() + 60 * 1000,
    });
    return null;
  }
}

export async function fetchVimeoThumbnailMap(videoUrls: string[]) {
  const uniqueUrls = [...new Set(videoUrls)];
  const entries = await Promise.all(
    uniqueUrls.map(async (url) => {
      const thumbnailUrl = await fetchVimeoThumbnailUrl(url);
      return [url, thumbnailUrl] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<string, string | null>;
}
