"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DrillLibraryVideoItem } from "@/lib/drill-library-videos";

type DrillCategoryKey = "hitting" | "fielding" | "mindset";

type FullScreenVideoFeedProps = {
  videos: DrillLibraryVideoItem[];
  initialIndex: number;
  categoryLabel: string;
  categoryKey: DrillCategoryKey;
  onClose: () => void;
  onSwitchCategory: (category: DrillCategoryKey) => void;
};

const drillLibraryEmbedParams = {
  title: "0",
  byline: "0",
  portrait: "0",
  dnt: "1",
  transparent: "0",
  rel: "0",
} as const;

const categoryOptions: Array<{ key: DrillCategoryKey; label: string }> = [
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "mindset", label: "Mindset" },
];

function buildDrillLibraryEmbedUrl(url: string, options?: { autoplay?: boolean; muted?: boolean }) {
  const parsedUrl = new URL(url);

  Object.entries(drillLibraryEmbedParams).forEach(([key, value]) => {
    parsedUrl.searchParams.set(key, value);
  });

  if (options?.autoplay) {
    parsedUrl.searchParams.set("autoplay", "1");
  }

  if (options?.muted) {
    parsedUrl.searchParams.set("muted", "1");
  }

  return parsedUrl.toString();
}

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
  const [slideDirection, setSlideDirection] = useState<"up" | "down" | null>(null);
  const [enterDirection, setEnterDirection] = useState<"up" | "down" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const currentVideo = videos[currentIndex];

  const embedUrl = useMemo(() => {
    if (!currentVideo) {
      return "";
    }

    return buildDrillLibraryEmbedUrl(currentVideo.url, { autoplay: true, muted: isMuted });
  }, [currentVideo, isMuted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setShowEndMessage(false);
  }, [initialIndex, videos]);

  const animateToIndex = useCallback(
    (nextIndex: number, direction: "up" | "down") => {
      if (isAnimating || nextIndex === currentIndex) {
        return;
      }

      setIsAnimating(true);
      setSlideDirection(direction);

      window.setTimeout(() => {
        setCurrentIndex(nextIndex);
        setShowEndMessage(false);
        setSlideDirection(null);
        setEnterDirection(direction);
        window.setTimeout(() => {
          setEnterDirection(null);
          setIsAnimating(false);
        }, 250);
      }, 250);
    },
    [currentIndex, isAnimating],
  );

  const goToNextVideo = useCallback(() => {
    if (currentIndex >= videos.length - 1) {
      setShowEndMessage(true);
      return;
    }

    animateToIndex(currentIndex + 1, "up");
  }, [animateToIndex, currentIndex, videos.length]);

  const goToPreviousVideo = useCallback(() => {
    if (currentIndex <= 0) {
      return;
    }

    setShowEndMessage(false);
    animateToIndex(currentIndex - 1, "down");
  }, [animateToIndex, currentIndex]);

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.targetTouches[0]?.clientY ?? null;
    touchEndY.current = null;
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
      goToNextVideo();
    } else if (distance < -minSwipeDistance) {
      goToPreviousVideo();
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  if (!mounted || !currentVideo) {
    return null;
  }

  const slideClass =
    slideDirection === "up"
      ? "is-sliding-up"
      : slideDirection === "down"
        ? "is-sliding-down"
        : enterDirection === "up"
          ? "is-entering-up"
          : enterDirection === "down"
            ? "is-entering-down"
            : "";

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
      <div className="fullscreen-video-top-bar">
        <div className="fullscreen-video-top-left">
          <button
            type="button"
            className="fullscreen-video-icon-button"
            onClick={() => setIsMuted((value) => !value)}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            <MuteIcon muted={isMuted} />
          </button>
          <span className="fullscreen-video-category">{categoryLabel}</span>
        </div>
        <button
          type="button"
          className="fullscreen-video-close-button"
          onClick={onClose}
          aria-label="Close video"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="fullscreen-video-stage">
        <div className={`fullscreen-video-frame ${slideClass}`}>
          {embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={currentVideo.title}
              className="fullscreen-video-iframe"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </div>
      </div>

      <p className="fullscreen-video-title">{currentVideo.title}</p>
      <p className="fullscreen-video-position">
        {currentIndex + 1} of {videos.length}
      </p>

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
