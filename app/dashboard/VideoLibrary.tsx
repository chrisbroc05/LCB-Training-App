"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  allDrillLibraryVideos,
  fieldingVideos,
  hittingVideos,
  mindsetVideos,
  type DrillLibraryVideoItem,
} from "@/lib/drill-library-videos";
import { buildDrillLibraryEmbedUrl, extractVimeoVideoId } from "@/lib/vimeo";

const drillCategories = [
  { key: "all", label: "All" },
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "mindset", label: "Mindset" },
] as const;

type DrillCategoryFilter = (typeof drillCategories)[number]["key"];
type DrillCategoryKey = DrillLibraryVideoItem["category"];

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

type VideoDimensions = {
  finalWidth: number;
  finalHeight: number;
};

const EXPAND_HINT_STORAGE_KEY = "video-expanded-hint-shown";

function calculateVideoDimensions(): VideoDimensions {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const availableHeight = vh - 180;
  const heightBasedWidth = availableHeight * (16 / 9);
  const useHeightBased = heightBasedWidth <= vw;
  const finalWidth = useHeightBased ? heightBasedWidth : vw;
  const finalHeight = useHeightBased ? availableHeight : vw * (9 / 16);

  return { finalWidth, finalHeight };
}

type MobileVideoOverlayProps = {
  video: DrillLibraryVideoItem;
  currentVideoIndex: number;
  currentCategoryVideos: DrillLibraryVideoItem[];
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
};

function MobileVideoOverlay({
  video,
  currentVideoIndex,
  currentCategoryVideos,
  onClose,
  onNext,
  onPrevious,
}: MobileVideoOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState<VideoDimensions>({
    finalWidth: 375,
    finalHeight: 211,
  });
  const [videoEnded, setVideoEnded] = useState(false);
  const [showExpandHint, setShowExpandHint] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const videoId = extractVimeoVideoId(video.url);
  const embedUrl = videoId
    ? `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&controls=1&api=1`
    : "";

  const isFirst = currentVideoIndex === 0;
  const isLast = currentVideoIndex === currentCategoryVideos.length - 1;

  const markExpandHintShown = useCallback(() => {
    try {
      sessionStorage.setItem(EXPAND_HINT_STORAGE_KEY, "true");
    } catch {
      // ignore storage errors
    }
    setShowExpandHint(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const hintShown = sessionStorage.getItem(EXPAND_HINT_STORAGE_KEY);
      setShowExpandHint(!hintShown);
    } catch {
      setShowExpandHint(true);
    }
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      setVideoDimensions(calculateVideoDimensions());
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    setVideoEnded(false);
  }, [video.url]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        markExpandHintShown();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [markExpandHintShown]);

  useEffect(() => {
    const subscribeToVimeoEvents = (iframeWindow: Window) => {
      ["finish", "play"].forEach((eventName) => {
        iframeWindow.postMessage(
          JSON.stringify({ method: "addEventListener", value: eventName }),
          "https://player.vimeo.com",
        );
      });
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://player.vimeo.com") {
        return;
      }

      try {
        const data = JSON.parse(event.data as string) as {
          event?: string;
          method?: string;
          value?: boolean;
          data?: { fullscreen?: boolean };
        };

        if (data.event === "ready" && iframeRef.current?.contentWindow) {
          subscribeToVimeoEvents(iframeRef.current.contentWindow);
        }

        if (data.event === "finish") {
          setVideoEnded(true);
        }

        if (data.event === "play") {
          setVideoEnded(false);
        }

        if (data.event === "fullscreenchange" && data.data?.fullscreen) {
          markExpandHintShown();
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [markExpandHintShown, embedUrl]);

  const handleNext = () => {
    if (isLast) {
      return;
    }

    setVideoEnded(false);
    onNext();
  };

  const handlePrevious = () => {
    if (isFirst) {
      return;
    }

    setVideoEnded(false);
    onPrevious();
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000000",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        style={{
          position: "absolute",
          top: "calc(16px + env(safe-area-inset-top))",
          right: "16px",
          background: "rgba(0,0,0,0.5)",
          border: "none",
          color: "white",
          fontSize: "24px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          cursor: "pointer",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        x
      </button>

      <div
        style={{
          width: "100%",
          paddingTop: "calc(48px + env(safe-area-inset-top))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${videoDimensions.finalWidth}px`,
            height: `${videoDimensions.finalHeight}px`,
          }}
        >
          {embedUrl ? (
            <iframe
              ref={iframeRef}
              key={embedUrl}
              src={embedUrl}
              title={video.title}
              style={{
                width: `${videoDimensions.finalWidth}px`,
                height: `${videoDimensions.finalHeight}px`,
                border: "none",
                display: "block",
              }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : null}

          {videoEnded ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.85)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              <p
                style={{
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                  textAlign: "center",
                  padding: "0 24px",
                }}
              >
                Video complete
              </p>
              {!isLast ? (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    backgroundColor: "#52B788",
                    color: "#0A1628",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 32px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Next Video
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: "transparent",
                  color: "#aaaaaa",
                  border: "1px solid #aaaaaa",
                  borderRadius: "12px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Back to Library
              </button>
            </div>
          ) : null}
        </div>

        {showExpandHint ? (
          <p
            style={{
              color: "#52B788",
              fontSize: "12px",
              textAlign: "center",
              marginTop: "8px",
              opacity: 0.8,
              padding: "0 16px",
            }}
          >
            Tap the expand icon in the video for full screen
          </p>
        ) : null}
      </div>

      <p
        style={{
          color: "white",
          fontSize: "14px",
          fontWeight: 600,
          marginTop: "16px",
          padding: "0 16px",
          textAlign: "center",
        }}
      >
        {video.title}
      </p>

      <p
        style={{
          color: "#888888",
          fontSize: "12px",
          marginTop: "8px",
        }}
      >
        {currentVideoIndex + 1} of {currentCategoryVideos.length}
      </p>

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "16px",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirst}
          style={{
            background: isFirst ? "#333333" : "#52B788",
            color: isFirst ? "#666666" : "#0A1628",
            border: "none",
            borderRadius: "8px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: isFirst ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isLast}
          style={{
            background: isLast ? "#333333" : "#52B788",
            color: isLast ? "#666666" : "#0A1628",
            border: "none",
            borderRadius: "8px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: isLast ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>,
    document.body,
  );
}

type VideoLibraryProps = {
  thumbnailMap?: Record<string, string | null>;
};

export default function VideoLibrary({ thumbnailMap = {} }: VideoLibraryProps) {
  const [selectedVideo, setSelectedVideo] = useState<DrillLibraryVideoItem | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentCategoryVideos, setCurrentCategoryVideos] = useState<DrillLibraryVideoItem[]>([]);
  const [mobileCategory, setMobileCategory] = useState<DrillCategoryFilter>("all");
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  const filteredMobileVideos = useMemo(() => {
    if (mobileCategory === "all") {
      return allDrillLibraryVideos;
    }

    return allDrillLibraryVideos.filter((video) => video.category === mobileCategory);
  }, [mobileCategory]);

  const openMobileVideo = (
    video: DrillLibraryVideoItem,
    categoryVideos: DrillLibraryVideoItem[],
    index: number,
  ) => {
    setSelectedVideo(video);
    setCurrentVideoIndex(index);
    setCurrentCategoryVideos(categoryVideos);
    setShowMobileOverlay(true);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    setShowMobileOverlay(false);
  };

  const goToNext = () => {
    if (currentVideoIndex >= currentCategoryVideos.length - 1) {
      return;
    }

    const nextIndex = currentVideoIndex + 1;
    setCurrentVideoIndex(nextIndex);
    setSelectedVideo(currentCategoryVideos[nextIndex]);
  };

  const goToPrevious = () => {
    if (currentVideoIndex <= 0) {
      return;
    }

    const previousIndex = currentVideoIndex - 1;
    setCurrentVideoIndex(previousIndex);
    setSelectedVideo(currentCategoryVideos[previousIndex]);
  };

  const openDesktopVideo = (video: DrillLibraryVideoItem) => {
    setSelectedVideo(video);
  };

  useEffect(() => {
    if (!selectedVideo || showMobileOverlay) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedVideo(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedVideo, showMobileOverlay]);

  const desktopModalUrl = useMemo(
    () =>
      selectedVideo && !showMobileOverlay
        ? buildDrillLibraryEmbedUrl(selectedVideo.url, { autoplay: true })
        : "",
    [selectedVideo, showMobileOverlay],
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
          {filteredMobileVideos.map((video, index) => {
            const categoryVideos =
              mobileCategory === "all"
                ? getVideosForCategory(video.category)
                : filteredMobileVideos;
            const videoIndex =
              mobileCategory === "all"
                ? categoryVideos.findIndex((entry) => entry.url === video.url)
                : index;

            return (
              <button
                key={video.url}
                type="button"
                onClick={() => openMobileVideo(video, categoryVideos, videoIndex)}
                className="mobile-card text-left"
              >
                <VideoThumbnail thumbnailUrl={thumbnailMap[video.url]} compact />
                <p className="mt-3 text-base font-semibold text-zinc-100">{video.title}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10 hidden space-y-8 md:block">
        <VideoSection
          heading="Hitting Library"
          description="Drill demonstrations for swing mechanics, load, posture, and bat path."
          videos={hittingVideos}
          thumbnailMap={thumbnailMap}
          onSelectVideo={openDesktopVideo}
        />
        <VideoSection
          heading="Fielding Library"
          description="Defensive drill work for control, timing, footwork, and making game-speed plays."
          videos={fieldingVideos}
          thumbnailMap={thumbnailMap}
          onSelectVideo={openDesktopVideo}
        />
        <VideoSection
          heading="Mindset Library"
          description="Mental performance lessons to build confidence, focus, and composure."
          videos={mindsetVideos}
          thumbnailMap={thumbnailMap}
          onSelectVideo={openDesktopVideo}
        />
      </section>

      {selectedVideo && showMobileOverlay ? (
        <MobileVideoOverlay
          video={selectedVideo}
          currentVideoIndex={currentVideoIndex}
          currentCategoryVideos={currentCategoryVideos}
          onClose={closeVideo}
          onNext={goToNext}
          onPrevious={goToPrevious}
        />
      ) : null}

      {selectedVideo && !showMobileOverlay ? (
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
            {desktopModalUrl ? (
              <iframe
                src={desktopModalUrl}
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
