"use client";

import { useEffect, useState } from "react";
import R2PresignedVideoPlayer from "@/app/components/R2PresignedVideoPlayer";
import type { CoachVideoListItem } from "@/lib/coach-video-shared";

export default function CoachVideoMessageEmbed({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<CoachVideoListItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await fetch(`/api/coach-videos/${encodeURIComponent(videoId)}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as {
        video?: CoachVideoListItem;
        error?: string;
      };
      if (!response.ok || !data.video) {
        setError(data.error ?? "Video not found.");
        return;
      }
      setVideo(data.video);
    })();
  }, [videoId]);

  if (error) {
    return <p className="text-xs text-red-300">{error}</p>;
  }

  if (!video) {
    return <p className="text-xs text-zinc-500">Loading video...</p>;
  }

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[#2b3650] bg-black">
      <R2PresignedVideoPlayer
        storedVideo={video.videoKey}
        posterR2Key={video.posterR2Key}
        title={video.title}
      />
    </div>
  );
}
