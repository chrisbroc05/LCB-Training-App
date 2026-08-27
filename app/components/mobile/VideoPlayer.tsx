"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DrillLibraryVideoItem } from "@/lib/drill-library-videos";
import { extractVimeoVideoId } from "@/lib/vimeo";

type VideoPlayerProps = {
  video: DrillLibraryVideoItem;
  videos: DrillLibraryVideoItem[];
  startIndex: number;
  onClose: () => void;
};

type FullscreenHTMLElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
};

function getFullscreenElement(doc: FullscreenDocument) {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.mozFullScreenElement ?? null;
}

function buildEmbedUrl(vimeoId: string) {
  return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&api=1&autopause=0`;
}

export default function VideoPlayer({ videos, startIndex, onClose }: VideoPlayerProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [videoEnded, setVideoEnded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isClosingRef = useRef(false);
  const wasFullscreenRef = useRef(false);

  const currentVideo = videos[currentIndex];
  const vimeoId = currentVideo ? extractVimeoVideoId(currentVideo.url) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current as FullscreenHTMLElement | null;
    if (!el) {
      return;
    }

    const requestFs =
      el.requestFullscreen ??
      el.webkitRequestFullscreen ??
      el.mozRequestFullScreen ??
      el.msRequestFullscreen;

    if (requestFs) {
      void Promise.resolve(requestFs.call(el)).catch(() => {
        // Fullscreen blocked -- fixed overlay still fills the viewport
      });
    }

    const doc = document as FullscreenDocument;

    const handleFsChange = () => {
      if (isClosingRef.current) {
        return;
      }

      const fsElement = getFullscreenElement(doc);
      if (fsElement) {
        wasFullscreenRef.current = true;
        return;
      }

      if (wasFullscreenRef.current) {
        isClosingRef.current = true;
        onClose();
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, [onClose]);

  useEffect(() => {
    setVideoEnded(false);
  }, [currentIndex]);

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
        const data = JSON.parse(event.data as string) as { event?: string };

        if (data.event === "ready" && iframeRef.current?.contentWindow) {
          subscribeToVimeoEvents(iframeRef.current.contentWindow);
        }

        if (data.event === "finish") {
          setVideoEnded(true);
        }

        if (data.event === "play") {
          setVideoEnded(false);
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentIndex]);

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setVideoEnded(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setVideoEnded(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleClose = () => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;

    const doc = document as FullscreenDocument;
    const exitFs =
      document.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.mozCancelFullScreen;

    if (exitFs && getFullscreenElement(doc)) {
      void Promise.resolve(exitFs.call(document)).catch(() => undefined).finally(onClose);
      return;
    }

    onClose();
  };

  if (!mounted || !currentVideo || !vimeoId) {
    return null;
  }

  return createPortal(
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close video"
        style={{
          position: "absolute",
          top: "calc(16px + env(safe-area-inset-top))",
          right: "16px",
          background: "rgba(0,0,0,0.6)",
          border: "none",
          color: "white",
          fontSize: "20px",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          cursor: "pointer",
          zIndex: 100000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        x
      </button>

      <p
        style={{
          position: "absolute",
          top: "calc(20px + env(safe-area-inset-top))",
          left: "16px",
          color: "white",
          fontSize: "13px",
          margin: 0,
          background: "rgba(0,0,0,0.5)",
          padding: "4px 10px",
          borderRadius: "12px",
          zIndex: 100000,
        }}
      >
        {currentIndex + 1} / {videos.length}
      </p>

      <iframe
        ref={iframeRef}
        key={vimeoId}
        src={buildEmbedUrl(vimeoId)}
        title={currentVideo.title}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />

      {videoEnded ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.88)",
            zIndex: 100001,
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
              fontSize: "18px",
              fontWeight: 700,
              textAlign: "center",
              padding: "0 24px",
            }}
          >
            {currentVideo.title}
          </p>
          <p
            style={{
              color: "#aaaaaa",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Video complete
          </p>
          {currentIndex < videos.length - 1 ? (
            <button
              type="button"
              onClick={goToNext}
              style={{
                backgroundColor: "#52B788",
                color: "#0A1628",
                border: "none",
                borderRadius: "12px",
                padding: "14px 40px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Next Video
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleClose}
            style={{
              backgroundColor: "transparent",
              color: "#aaaaaa",
              border: "1px solid #555555",
              borderRadius: "12px",
              padding: "12px 32px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Back to Library
          </button>
        </div>
      ) : null}

      {!videoEnded ? (
        <div
          style={{
            position: "absolute",
            bottom: "calc(24px + env(safe-area-inset-bottom))",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            padding: "0 24px",
            zIndex: 100000,
          }}
        >
          <button
            type="button"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            style={{
              background: currentIndex === 0 ? "rgba(255,255,255,0.1)" : "rgba(82,183,136,0.9)",
              color: currentIndex === 0 ? "#666666" : "#0A1628",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>

          <p
            style={{
              color: "white",
              fontSize: "12px",
              textAlign: "center",
              flex: 1,
              margin: "0 12px",
              alignSelf: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentVideo.title}
          </p>

          <button
            type="button"
            onClick={goToNext}
            disabled={currentIndex === videos.length - 1}
            style={{
              background:
                currentIndex === videos.length - 1
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(82,183,136,0.9)",
              color: currentIndex === videos.length - 1 ? "#666666" : "#0A1628",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: currentIndex === videos.length - 1 ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
