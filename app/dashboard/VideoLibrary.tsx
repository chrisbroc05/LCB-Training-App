"use client";

import { useEffect, useMemo, useState } from "react";
import MobileBottomSheet from "@/app/components/mobile/MobileBottomSheet";
import { useIsMobile } from "@/app/components/mobile/useIsMobile";
import {
  allDrillLibraryVideos,
  fieldingVideos,
  hittingVideos,
  mindsetVideos,
  type DrillLibraryVideoItem,
} from "@/lib/drill-library-videos";

const drillCategories = [
  { key: "all", label: "All" },
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "mindset", label: "Mindset" },
] as const;

type DrillCategoryFilter = (typeof drillCategories)[number]["key"];

const drillLibraryEmbedParams = {
  title: "0",
  byline: "0",
  portrait: "0",
  dnt: "1",
  transparent: "0",
  rel: "0",
} as const;

function buildDrillLibraryEmbedUrl(url: string, options?: { autoplay?: boolean }) {
  const parsedUrl = new URL(url);

  Object.entries(drillLibraryEmbedParams).forEach(([key, value]) => {
    parsedUrl.searchParams.set(key, value);
  });

  if (options?.autoplay) {
    parsedUrl.searchParams.set("autoplay", "1");
  }

  return parsedUrl.toString();
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
  const [selectedVideo, setSelectedVideo] = useState<DrillLibraryVideoItem | null>(null);
  const [mobileCategory, setMobileCategory] = useState<DrillCategoryFilter>("all");
  const isMobile = useIsMobile();

  const filteredMobileVideos = useMemo(() => {
    if (mobileCategory === "all") {
      return allDrillLibraryVideos;
    }

    return allDrillLibraryVideos.filter((video) => video.category === mobileCategory);
  }, [mobileCategory]);

  useEffect(() => {
    if (!selectedVideo) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedVideo(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedVideo]);

  const modalUrl = useMemo(
    () =>
      selectedVideo ? buildDrillLibraryEmbedUrl(selectedVideo.url, { autoplay: true }) : "",
    [selectedVideo],
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
          {filteredMobileVideos.map((video) => (
            <button
              key={video.url}
              type="button"
              onClick={() => setSelectedVideo(video)}
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
          onSelectVideo={setSelectedVideo}
        />
        <VideoSection
          heading="Fielding Library"
          description="Defensive drill work for control, timing, footwork, and making game-speed plays."
          videos={fieldingVideos}
          thumbnailMap={thumbnailMap}
          onSelectVideo={setSelectedVideo}
        />
        <VideoSection
          heading="Mindset Library"
          description="Mental performance lessons to build confidence, focus, and composure."
          videos={mindsetVideos}
          thumbnailMap={thumbnailMap}
          onSelectVideo={setSelectedVideo}
        />
      </section>

      {selectedVideo && isMobile ? (
        <MobileBottomSheet
          open={Boolean(selectedVideo)}
          onClose={() => setSelectedVideo(null)}
          variant="cinematic"
          showCloseButton
        >
          <div className="mobile-video-player-shell">
            {modalUrl ? (
              <iframe
                src={modalUrl}
                title={selectedVideo.title}
                className="mobile-video-player-iframe"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : null}
          </div>
          <p className="mobile-video-player-title">{selectedVideo.title}</p>
        </MobileBottomSheet>
      ) : null}

      {selectedVideo && !isMobile ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative h-[78dvh] w-[96vw] max-w-6xl overflow-hidden rounded-2xl border border-[#2b3650] bg-black shadow-2xl sm:h-[80vh] sm:w-[85vw] lg:w-[80vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-zinc-100 transition hover:bg-black"
            >
              Close
            </button>
            {modalUrl ? (
              <iframe
                src={modalUrl}
                title={selectedVideo.title}
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
