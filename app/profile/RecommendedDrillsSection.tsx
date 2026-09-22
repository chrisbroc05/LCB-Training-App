"use client";

import { useEffect, useMemo, useState } from "react";
import VideoPlayer from "@/app/components/mobile/VideoPlayer";
import {
  getDrillCategoryLabel,
  getDrillLibraryVideosByIds,
  type DrillLibraryVideoItem,
} from "@/lib/drill-library-videos";
import { buildDrillLibraryEmbedUrl } from "@/lib/vimeo";

type RecommendedDrillsSectionProps = {
  recommendedDrillIds: string[];
  thumbnailMap: Record<string, string | null>;
};

function WhitePlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7-11-7Z" />
    </svg>
  );
}

function DrillThumbnail({ thumbnailUrl }: { thumbnailUrl?: string | null }) {
  const [hasImageError, setHasImageError] = useState(false);
  const showThumbnail = Boolean(thumbnailUrl) && !hasImageError;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#2b3650] bg-[#0b1324]">
      {showThumbnail ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl ?? ""}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
          <div className="absolute inset-0 bg-black/45" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f1d34_0%,#152238_55%,#0b1324_100%)]" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
          <WhitePlayIcon />
        </span>
      </div>
    </div>
  );
}

export default function RecommendedDrillsSection({
  recommendedDrillIds,
  thumbnailMap,
}: RecommendedDrillsSectionProps) {
  const recommendedDrills = useMemo(
    () => getDrillLibraryVideosByIds(recommendedDrillIds),
    [recommendedDrillIds],
  );
  const [playerState, setPlayerState] = useState<{
    videos: DrillLibraryVideoItem[];
    startIndex: number;
  } | null>(null);
  const [desktopVideo, setDesktopVideo] = useState<DrillLibraryVideoItem | null>(null);

  useEffect(() => {
    if (!desktopVideo) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopVideo(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [desktopVideo]);

  if (recommendedDrills.length === 0) {
    return null;
  }

  const openVideo = (video: DrillLibraryVideoItem, index: number) => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setPlayerState({
        videos: recommendedDrills,
        startIndex: index,
      });
      return;
    }

    setDesktopVideo(video);
  };

  const desktopModalUrl = desktopVideo
    ? buildDrillLibraryEmbedUrl(desktopVideo.url, { autoplay: true })
    : "";

  return (
    <>
      <div className="mt-4 space-y-3">
        <p className="text-sm font-semibold text-zinc-100">
          Drills Coach Broc Recommends For You
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {recommendedDrills.map((video, index) => (
            <button
              key={video.url}
              type="button"
              onClick={() => openVideo(video, index)}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 text-left transition hover:border-[#2b7c4b] hover:bg-[#11203a]"
            >
              <DrillThumbnail thumbnailUrl={thumbnailMap[video.url]} />
              <p className="mt-3 text-sm font-semibold text-zinc-100">{video.title}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                {getDrillCategoryLabel(video.category)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {playerState ? (
        <VideoPlayer
          video={playerState.videos[playerState.startIndex]}
          videos={playerState.videos}
          startIndex={playerState.startIndex}
          onClose={() => setPlayerState(null)}
        />
      ) : null}

      {desktopVideo ? (
        <div
          className="fixed inset-0 z-50 hidden items-center justify-center bg-black/85 p-4 md:flex"
          onClick={() => setDesktopVideo(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#2b3650] bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2b3650] px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">{desktopVideo.title}</p>
              <button
                type="button"
                onClick={() => setDesktopVideo(null)}
                className="rounded-full border border-[#2b3650] px-3 py-1 text-xs text-zinc-300 transition hover:border-[#3c4a68]"
              >
                Close
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={desktopModalUrl}
                title={desktopVideo.title}
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
