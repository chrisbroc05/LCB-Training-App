import { extractVimeoVideoId } from "@/lib/drill-library-videos";
import { TtlLruCache } from "@/lib/ttl-lru-cache";

const THUMBNAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const THUMBNAIL_CACHE_MAX_ENTRIES = 500;
const thumbnailCache = new TtlLruCache<string | null>(THUMBNAIL_CACHE_MAX_ENTRIES);

type VimeoOEmbedResponse = {
  thumbnail_url?: string;
};

export async function fetchVimeoThumbnailUrl(videoUrl: string): Promise<string | null> {
  const videoId = extractVimeoVideoId(videoUrl);
  if (!videoId) {
    return null;
  }

  const cached = thumbnailCache.get(videoId);
  if (cached !== undefined) {
    return cached;
  }

  const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
    `https://vimeo.com/${videoId}`,
  )}`;

  try {
    const response = await fetch(oEmbedUrl, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      thumbnailCache.set(videoId, null, Date.now() + THUMBNAIL_CACHE_TTL_MS);
      return null;
    }

    const payload = (await response.json()) as VimeoOEmbedResponse;
    const thumbnailUrl = payload.thumbnail_url ?? null;

    thumbnailCache.set(videoId, thumbnailUrl, Date.now() + THUMBNAIL_CACHE_TTL_MS);

    return thumbnailUrl;
  } catch {
    thumbnailCache.set(videoId, null, Date.now() + 60 * 1000);
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
