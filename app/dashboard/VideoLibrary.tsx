"use client";

import { useEffect, useMemo, useState } from "react";
import VideoPlayer from "@/app/components/mobile/VideoPlayer";
import {
  allDrillLibraryVideos,
  fieldingVideos,
  hittingVideos,
  mindsetVideos,
  type DrillLibraryVideoItem,
} from "@/lib/drill-library-videos";
import { buildDrillLibraryEmbedUrl } from "@/lib/vimeo";

const drillCategories = [
  { key: "all", label: "All" },
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "mindset", label: "Mindset" },
] as const;

type DrillCategoryFilter = (typeof drillCategories)[number]["key"];
type DrillCategoryKey = DrillLibraryVideoItem["category"];

type PlayerState = {
  video: DrillLibraryVideoItem;
  videos: DrillLibraryVideoItem[];
  startIndex: number;
};

function getVideosForCategory(category: DrillCategoryKey) {
  if (category === "hitting") {
    return hittingVideos;
  }

  if (category === "fielding") {
    return fieldingVideos;
  }

  return mindsetVideos;
}

function WhitePlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7-11-7Z" />
    </svg>
  );
}

function VideoThumbnail({
  thumbnailUrl,
  compact = false,
}: {
  thumbnailUrl?: string | null;
  compact?: boolean;
}) {
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
        <span
          className={
            compact
              ? "inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white"
              : "inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white"
          }
        >
          <WhitePlayIcon />
        </span>
      </div>
    </div>
  );
}

type VideoSectionProps = {
  heading: string;
  description: string;
  videos: DrillLibraryVideoItem[];
  thumbnailMap: Record<string, string | null>;
  onSelectVideo: (video: DrillLibraryVideoItem) => void;
};

function VideoSection({
  heading,
  description,
  videos,
  thumbnailMap,
  onSelectVideo,
}: VideoSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{heading}</h2>
      <p className="mt-2 text-zinc-300">{description}</p>
      <div className="mt-6 grid gap-5 sm:gap-6 lg:grid-cols-2">
        {videos.map((video) => (
          <button
            key={video.url}
            type="button"
            onClick={() => onSelectVideo(video)}
            className="group rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 text-left transition hover:border-[#2b7c4b] hover:bg-[#11203a] sm:p-6"
          >
            <VideoThumbnail thumbnailUrl={thumbnailMap[video.url]} />
            <p className="mt-4 text-base font-semibold text-zinc-100 sm:text-lg">{video.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

type VideoLibraryProps = {
  thumbnailMap?: Record<string, string | null>;
};

export default function VideoLibrary({ thumbnailMap = {} }: VideoLibraryProps) {
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [desktopVideo, setDesktopVideo] = useState<DrillLibraryVideoItem | null>(null);
  const [mobileCategory, setMobileCategory] = useState<DrillCategoryFilter>("all");

  const filteredMobileVideos = useMemo(() => {
    if (mobileCategory === "all") {
      return allDrillLibraryVideos;
    }

    return allDrillLibraryVideos.filter((video) => video.category === mobileCategory);
  }, [mobileCategory]);

  const openVideo = (video: DrillLibraryVideoItem, index: number) => {
    const categoryVideos =
      mobileCategory === "all" ? getVideosForCategory(video.category) : filteredMobileVideos;
    const videoIndex =
      mobileCategory === "all"
        ? categoryVideos.findIndex((entry) => entry.url === video.url)
        : index;

    setPlayerState({
      video,
      videos: categoryVideos,
      startIndex: videoIndex >= 0 ? videoIndex : 0,
    });
  };

  const closeVideo = () => {
    setPlayerState(null);
  };

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

  const desktopModalUrl = useMemo(
    () => (desktopVideo ? buildDrillLibraryEmbedUrl(desktopVideo.url, { autoplay: true }) : ""),
    [desktopVideo],
  );

  return (
    <>
      <section className="mt-6 space-y-4 px-4 md:hidden">
        <div className="mobile-filter-row">
          {drillCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setMobileCategory(category.key)}
              className={`mobile-filter-pill ${mobileCategory === category.key ? "is-active" : ""}`}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="mobile-card-stack">
          {filteredMobileVideos.map((video, index) => (
            <button
              key={video.url}
              type="button"
              onClick={() => openVideo(video, index)}
              className="mobile-card text-left"
            >
              <VideoThumbnail thumbnailUrl={thumbnailMap[video.url]} compact />
              <p className="mt-3 text-base font-semibold text-zinc-100">{video.title}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 hidden space-y-8 md:block">
        <VideoSection
          heading="Hitting Library"
          description="Drill demonstrations for swing mechanics, load, posture, and bat path."
          videos={hittingVideos}
          thumbnailMap={thumbnailMap}
          onSelectVideo={setDesktopVideo}
        />
        <VideoSection
          heading="Fielding Library"
          description="Defensive drill work for control, timing, footwork, and making game-speed plays."
          videos={fieldingVideos}
          thumbnailMap={thumbnailMap}
          onSelectVideo={setDesktopVideo}
        />
        <VideoSection
          heading="Mindset Library"
          description="Mental performance lessons to build confidence, focus, and composure."
          videos={mindsetVideos}
          thumbnailMap={thumbnailMap}
          onSelectVideo={setDesktopVideo}
        />
      </section>

      {playerState ? (
        <VideoPlayer
          video={playerState.video}
          videos={playerState.videos}
          startIndex={playerState.startIndex}
          onClose={closeVideo}
        />
      ) : null}

      {desktopVideo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={() => setDesktopVideo(null)}
        >
          <div
            className="relative h-[78dvh] w-[96vw] max-w-6xl overflow-hidden rounded-2xl border border-[#2b3650] bg-black shadow-2xl sm:h-[80vh] sm:w-[85vw] lg:w-[80vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDesktopVideo(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-zinc-100 transition hover:bg-black"
            >
              Close
            </button>
            {desktopModalUrl ? (
              <iframe
                src={desktopModalUrl}
                title={desktopVideo.title}
                className="h-full w-full"
                allow="fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
