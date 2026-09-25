"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isR2VideoReference, parseR2VideoReference } from "@/lib/r2";

type R2PresignedVideoPlayerProps = {
  storedVideo: string;
  title?: string;
  className?: string;
};

type PresignedPlaybackResponse = {
  playbackUrl: string;
  contentType: string;
  expiresInSeconds: number;
};

function resolveR2Key(storedVideo: string) {
  if (isR2VideoReference(storedVideo)) {
    return parseR2VideoReference(storedVideo);
  }

  return storedVideo.trim() || null;
}

export default function R2PresignedVideoPlayer({
  storedVideo,
  title = "Video",
  className = "h-full w-full",
}: R2PresignedVideoPlayerProps) {
  const r2Key = resolveR2Key(storedVideo);
  const videoRef = useRef<HTMLVideoElement>(null);
  const retriedRef = useRef(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaybackUrl = useCallback(async () => {
    if (!r2Key) {
      throw new Error("Missing video key.");
    }

    const response = await fetch("/api/video-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r2Key }),
    });

    if (!response.ok) {
      throw new Error("Unable to load video.");
    }

    const payload = (await response.json()) as PresignedPlaybackResponse;
    return payload.playbackUrl;
  }, [r2Key]);

  useEffect(() => {
    if (!r2Key) {
      setLoading(false);
      setError("Unable to load video.");
      return;
    }

    let cancelled = false;
    retriedRef.current = false;
    setLoading(true);
    setError(null);
    setPlaybackUrl(null);

    void fetchPlaybackUrl()
      .then((url) => {
        if (!cancelled) {
          setPlaybackUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load video.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPlaybackUrl, r2Key, storedVideo]);

  const handleVideoError = () => {
    if (retriedRef.current) {
      setError("Unable to play video.");
      return;
    }

    retriedRef.current = true;

    void fetchPlaybackUrl()
      .then((url) => {
        setPlaybackUrl(url);
        setError(null);
        if (videoRef.current) {
          videoRef.current.src = url;
          void videoRef.current.load();
        }
      })
      .catch(() => {
        setError("Unable to play video.");
      });
  };

  if (loading) {
    return <p className="px-4 py-3 text-sm text-zinc-400">Loading video...</p>;
  }

  if (error || !playbackUrl) {
    return <p className="px-4 py-3 text-sm text-red-300">{error ?? "Unable to load video."}</p>;
  }

  return (
    <video
      ref={videoRef}
      src={playbackUrl}
      controls
      playsInline
      preload="metadata"
      title={title}
      className={className}
      onError={handleVideoError}
    />
  );
}
