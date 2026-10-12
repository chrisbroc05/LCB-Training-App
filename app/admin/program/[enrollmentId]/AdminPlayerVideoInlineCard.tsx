"use client";

import { useState } from "react";
import R2PresignedVideoPlayer from "@/app/components/R2PresignedVideoPlayer";
import { formatDateTime } from "@/lib/format-date";

type AdminPlayerVideoInlineCardProps = {
  title: string;
  createdAt: string;
  videoKey: string;
  note?: string | null;
  watchedLabel?: string | null;
  href?: string | null;
};

export default function AdminPlayerVideoInlineCard({
  title,
  createdAt,
  videoKey,
  note,
  watchedLabel,
  href,
}: AdminPlayerVideoInlineCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const downloadVideo = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch("/api/admin/video-download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key: videoKey }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        downloadUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.downloadUrl) {
        throw new Error(data.error ?? "Unable to download.");
      }
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unable to download.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="rounded-xl border border-[#2b3650] bg-black/20 p-3 space-y-3">
      <div>
        <p className="font-semibold text-zinc-100">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{formatDateTime(createdAt)}</p>
        {watchedLabel ? <p className="mt-1 text-xs text-zinc-400">{watchedLabel}</p> : null}
        {note?.trim() ? <p className="mt-2 text-sm text-zinc-300">{note}</p> : null}
        {href ? (
          <a href={href} className="mt-2 inline-block text-xs font-semibold text-[#52B788]">
            Open submission
          </a>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-xl border border-[#18243a] bg-black">
        <R2PresignedVideoPlayer storedVideo={videoKey} title={title} className="aspect-video w-full" />
      </div>
      <button
        type="button"
        disabled={downloading}
        onClick={() => void downloadVideo()}
        className="rounded-full border border-[#52B788] px-3 py-1.5 text-xs font-semibold text-[#52B788] disabled:opacity-60"
      >
        {downloading ? "Preparing..." : "Download"}
      </button>
      {downloadError ? <p className="text-xs text-red-300">{downloadError}</p> : null}
    </article>
  );
}
