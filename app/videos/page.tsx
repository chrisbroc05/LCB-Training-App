"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format-date";
import { formatCoachVideoDrillCategoryLabel, type CoachVideoListItem } from "@/lib/coach-video-shared";

export default function VideosPage() {
  const [videos, setVideos] = useState<CoachVideoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/coach-videos", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        videos?: CoachVideoListItem[];
        error?: string;
      };

      setLoading(false);

      if (!response.ok) {
        setError(data.error ?? "Unable to load videos.");
        return;
      }

      setVideos(data.videos ?? []);
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-100">Videos from Coach Broc</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Coach videos sent to you plus feedback from your coaching submissions.
      </p>

      {loading ? <p className="mt-6 text-sm text-zinc-400">Loading videos...</p> : null}
      {error ? <p className="mt-6 text-sm text-red-300">{error}</p> : null}

      {!loading && !error && videos.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">No videos yet.</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {videos.map((video) => {
          const isUnwatched = video.source === "coach_video" && !video.viewedAt;
          const href =
            video.source === "coach_video"
              ? `/videos/${video.id}`
              : video.submissionType && video.submissionId
                ? `/profile?type=${video.submissionType.toLowerCase()}&id=${video.submissionId}`
                : `/videos/${video.id}`;

          return (
            <Link
              key={video.id}
              href={href}
              className="block rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 px-4 py-4 transition hover:border-[#52B788]/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-100">{video.title}</p>
                    {isUnwatched ? (
                      <span className="rounded-full bg-[#22c55e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                        New
                      </span>
                    ) : null}
                  </div>
                  {video.note?.trim() ? (
                    <p className="mt-2 text-sm text-zinc-400">{video.note}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-zinc-500">{formatDateTime(video.createdAt)}</p>
                </div>
                {video.drillCategory ? (
                  <span className="rounded-full bg-[#24314a] px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
                    {formatCoachVideoDrillCategoryLabel(video.drillCategory)}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
