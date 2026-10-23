"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VideoPlayer from "@/app/components/mobile/VideoPlayer";
import {
  getDrillCategoryLabel,
  getDrillLibraryVideosByIds,
  type DrillLibraryVideoItem,
} from "@/lib/drill-library-videos";
import { buildDrillLibraryEmbedUrl } from "@/lib/vimeo";

type FocusDrillCardsProps = {
  drillIds: string[];
  thumbnailMap: Record<string, string | null>;
  seeAllHref?: string;
  seeAllLabel?: string;
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
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white">
          <WhitePlayIcon />
        </span>
      </div>
    </div>
  );
}

export default function FocusDrillCards({
  drillIds,
  thumbnailMap,
  seeAllHref = "/drill-library",
  seeAllLabel = "See all drills",
}: FocusDrillCardsProps) {
  const drills = useMemo(() => getDrillLibraryVideosByIds(drillIds), [drillIds]);
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

  if (drills.length === 0) {
    return null;
  }

  const openVideo = (video: DrillLibraryVideoItem, index: number) => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setPlayerState({
        videos: drills,
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
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drills.map((video, index) => (
          <button
            key={video.url}
            type="button"
            onClick={() => openVideo(video, index)}
            className="rounded-xl border border-[#2b3650]/80 bg-[#0b1324]/60 p-3 text-left transition hover:border-[#52B788]/50"
          >
            <DrillThumbnail thumbnailUrl={thumbnailMap[video.url]} />
            <p className="mt-2 text-sm font-semibold leading-snug text-zinc-100">{video.title}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
              {getDrillCategoryLabel(video.category)}
            </p>
          </button>
        ))}
      </div>

      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="mt-3 inline-flex text-xs font-semibold text-[#52B788] underline underline-offset-2"
        >
          {seeAllLabel}
        </Link>
      ) : null}

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
