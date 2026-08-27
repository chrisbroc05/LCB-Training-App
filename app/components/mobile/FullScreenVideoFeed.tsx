"use client";

import Player from "@vimeo/player";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DrillLibraryVideoItem } from "@/lib/drill-library-videos";
import { buildDrillLibraryEmbedUrl, extractVimeoVideoId } from "@/lib/vimeo";

type DrillCategoryKey = "hitting" | "fielding" | "mindset";

type FullScreenVideoFeedProps = {
  videos: DrillLibraryVideoItem[];
  initialIndex: number;
  categoryLabel: string;
  categoryKey: DrillCategoryKey;
  onClose: () => void;
  onSwitchCategory: (category: DrillCategoryKey) => void;
};

const categoryOptions: Array<{ key: DrillCategoryKey; label: string }> = [
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "mindset", label: "Mindset" },
];

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MuteIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 9 5 13H3v-2h2l4-4v6Zm8.5 3a4.5 4.5 0 0 0-2-3.7M15 5.5a9 9 0 0 1 0 13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 9 5 13H3v-2h2l4-4v6Zm4 2.5a3 3 0 0 0 0-5M15 5.5a9 9 0 0 1 0 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function applyFallbackIframeSize(iframe: HTMLIFrameElement) {
  iframe.style.width = "100vw";
  iframe.style.height = `${window.innerWidth * (9 / 16)}px`;
}

export default function FullScreenVideoFeed({
  videos,
  initialIndex,
  categoryLabel,
  categoryKey,
  onClose,
  onSwitchCategory,
}: FullScreenVideoFeedProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [useFallbackSize, setUseFallbackSize] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const currentIndexRef = useRef(initialIndex);
  const videosRef = useRef(videos);
  const onCloseRef = useRef(onClose);
  const isClosingRef = useRef(false);
  const hasEnteredFullscreenRef = useRef(false);
  const advanceTimeoutRef = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const currentVideo = videos[currentIndex];

  const initialEmbedUrl = useMemo(() => {
    const startVideo = videos[initialIndex] ?? videos[0];
    if (!startVideo) {
      return "";
    }

    return buildDrillLibraryEmbedUrl(startVideo.url, { autoplay: true });
  }, [initialIndex, videos]);

  const requestPlayerFullscreen = useCallback(async (player: Player) => {
    try {
      await player.requestFullscreen();
      hasEnteredFullscreenRef.current = true;
      setUseFallbackSize(false);
    } catch {
      setUseFallbackSize(true);
      if (iframeRef.current) {
        applyFallbackIframeSize(iframeRef.current);
      }
    }
  }, []);

  const loadVideoAtIndex = useCallback(
    async (index: number) => {
      const player = playerRef.current;
      const categoryVideos = videosRef.current;
      const targetVideo = categoryVideos[index];
      const videoId = targetVideo ? extractVimeoVideoId(targetVideo.url) : null;

      if (!player || !videoId) {
        return;
      }

      setCurrentIndex(index);
      currentIndexRef.current = index;
      setShowEndMessage(false);
      setShowBlocker(false);

      try {
        await player.loadVideo(Number(videoId));
        await player.play();
        if (isMuted) {
          await player.setVolume(0);
        }
        await requestPlayerFullscreen(player);
      } catch (error) {
        console.error("Error loading video:", error);
      }
    },
    [isMuted, requestPlayerFullscreen],
  );

  const goToNextVideo = useCallback(async () => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex >= videosRef.current.length) {
      setShowEndMessage(true);
      return;
    }

    await loadVideoAtIndex(nextIndex);
  }, [loadVideoAtIndex]);

  const goToPreviousVideo = useCallback(async () => {
    const previousIndex = currentIndexRef.current - 1;
    if (previousIndex < 0) {
      return;
    }

    await loadVideoAtIndex(previousIndex);
  }, [loadVideoAtIndex]);

  const goToNextVideoRef = useRef(goToNextVideo);
  goToNextVideoRef.current = goToNextVideo;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        isClosingRef.current = true;
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !initialEmbedUrl) {
      return;
    }

    isClosingRef.current = false;
    const player = new Player(iframe);
    playerRef.current = player;

    const handleEnded = () => {
      setShowBlocker(true);

      if (currentIndexRef.current >= videosRef.current.length - 1) {
        setShowEndMessage(true);
        return;
      }

      advanceTimeoutRef.current = window.setTimeout(() => {
        setShowBlocker(false);
        void goToNextVideoRef.current();
      }, 1500);
    };

    const handlePlay = () => {
      setShowBlocker(false);
    };

    const handleFullscreenChange = (data: { fullscreen: boolean }) => {
      if (data.fullscreen) {
        hasEnteredFullscreenRef.current = true;
        return;
      }

      if (hasEnteredFullscreenRef.current && !isClosingRef.current) {
        isClosingRef.current = true;
        onCloseRef.current();
      }
    };

    player.on("ended", handleEnded);
    player.on("play", handlePlay);
    player.on("fullscreenchange", handleFullscreenChange);

    void player.ready().then(async () => {
      if (initialIndex > 0) {
        const startVideo = videosRef.current[initialIndex];
        const videoId = startVideo ? extractVimeoVideoId(startVideo.url) : null;
        if (videoId) {
          await player.loadVideo(Number(videoId));
          await player.play();
        }
      }

      await requestPlayerFullscreen(player);
    });

    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }

      player.off("ended", handleEnded);
      player.off("play", handlePlay);
      player.off("fullscreenchange", handleFullscreenChange);
      playerRef.current = null;
      void player.destroy().catch(() => undefined);
    };
  }, [initialEmbedUrl, initialIndex, requestPlayerFullscreen]);

  const handleClose = () => {
    isClosingRef.current = true;

    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    const player = playerRef.current;
    if (!player) {
      onClose();
      return;
    }

    void player.exitFullscreen().catch(() => undefined).finally(onClose);
  };

  const handleToggleMute = async () => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    try {
      await player.setVolume(nextMuted ? 0 : 1);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.targetTouches[0]?.clientY ?? null;
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    touchEndY.current = event.targetTouches[0]?.clientY ?? null;
  };

  const onTouchEnd = () => {
    if (touchStartY.current === null || touchEndY.current === null) {
      return;
    }

    const distance = touchStartY.current - touchEndY.current;

    if (distance > minSwipeDistance) {
      void goToNextVideo();
    } else if (distance < -minSwipeDistance) {
      void goToPreviousVideo();
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  if (!mounted || !currentVideo || !initialEmbedUrl) {
    return null;
  }

  const otherCategories = categoryOptions.filter((category) => category.key !== categoryKey);

  return createPortal(
    <div
      className="fullscreen-video-root"
      role="dialog"
      aria-modal="true"
      aria-label={`${categoryLabel} video player`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="fullscreen-video-stage">
        <div className="fullscreen-video-player-shell">
          <iframe
            ref={iframeRef}
            src={initialEmbedUrl}
            title={currentVideo.title}
            className={`fullscreen-video-iframe ${useFallbackSize ? "is-fallback-size" : ""}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
          {showBlocker ? <div className="fullscreen-video-end-blocker" aria-hidden="true" /> : null}
        </div>
      </div>

      <div className="fullscreen-video-top-bar">
        <div className="fullscreen-video-top-left">
          <button
            type="button"
            className="fullscreen-video-icon-button"
            onClick={() => {
              void handleToggleMute();
            }}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            <MuteIcon muted={isMuted} />
          </button>
          <span className="fullscreen-video-category">{categoryLabel}</span>
        </div>
        <button
          type="button"
          className="fullscreen-video-close-button"
          onClick={handleClose}
          aria-label="Close video"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="fullscreen-video-meta">
        <p className="fullscreen-video-title">{currentVideo.title}</p>
        <p className="fullscreen-video-position">
          {currentIndex + 1} of {videos.length}
        </p>
      </div>

      {showEndMessage ? (
        <div className="fullscreen-video-end-panel">
          <p className="fullscreen-video-end-text">
            You have reached the end of the {categoryLabel} videos
          </p>
          <div className="fullscreen-video-end-actions">
            {otherCategories.map((category) => (
              <button
                key={category.key}
                type="button"
                className="fullscreen-video-end-button"
                onClick={() => onSwitchCategory(category.key)}
              >
                Switch to {category.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
