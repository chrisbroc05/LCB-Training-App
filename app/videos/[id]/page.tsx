"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import R2PresignedVideoPlayer from "@/app/components/R2PresignedVideoPlayer";
import { formatDateTime } from "@/lib/format-date";
import {
  formatCoachVideoDrillCategoryLabel,
  type CoachVideoListItem,
} from "@/lib/coach-video-shared";

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const videoId = params.id;
  const [video, setVideo] = useState<CoachVideoListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!videoId) {
      return;
    }

    void (async () => {
      const response = await fetch("/api/coach-videos", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        videos?: CoachVideoListItem[];
        error?: string;
      };

      setLoading(false);

      if (!response.ok) {
        setError(data.error ?? "Unable to load video.");
        return;
      }

      const match = (data.videos ?? []).find((item) => item.id === videoId) ?? null;
      if (!match) {
        setError("Video not found.");
        return;
      }

      setVideo(match);
    })();
  }, [videoId]);

  const handleFirstPlay = () => {
    if (!video || video.source !== "coach_video" || video.viewedAt) {
      return;
    }

    void fetch(`/api/coach-videos/${video.id}/viewed`, { method: "POST" });
    setVideo({ ...video, viewedAt: new Date().toISOString() });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/videos" className="text-sm font-semibold text-[#52B788]">
        Back to videos
      </Link>

      {loading ? <p className="mt-6 text-sm text-zinc-400">Loading video...</p> : null}
      {error ? <p className="mt-6 text-sm text-red-300">{error}</p> : null}

      {video ? (
        <div className="mt-6 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{video.title}</h1>
            <p className="mt-2 text-sm text-zinc-400">{formatDateTime(video.createdAt)}</p>
            {video.drillCategory ? (
              <p className="mt-2 text-sm text-zinc-400">
                Category: {formatCoachVideoDrillCategoryLabel(video.drillCategory)}
              </p>
            ) : null}
          </div>

          {video.note?.trim() ? (
            <p className="rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 p-4 text-sm text-zinc-300">
              {video.note}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-[#2b3650] bg-black">
            <R2PresignedVideoPlayer
              storedVideo={video.videoKey}
              title={video.title}
              onFirstPlay={handleFirstPlay}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
