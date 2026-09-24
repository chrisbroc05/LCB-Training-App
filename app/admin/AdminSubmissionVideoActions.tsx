"use client";

import { useEffect, useState } from "react";
import { isR2VideoReference, parseR2VideoReference } from "@/lib/r2";

type AdminSubmissionVideoActionsProps = {
  storedVideo: string;
  inlineVideoUrl: string;
};

type PresignedDownloadResponse = {
  downloadUrl: string;
  fileName: string;
  contentType: string;
};

function canShareVideoFiles() {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }

  try {
    const probeFile = new File([new Blob()], "probe.mp4", { type: "video/mp4" });
    return navigator.canShare({ files: [probeFile] });
  } catch {
    return false;
  }
}

function getLegacyDownloadUrl(inlineVideoUrl: string) {
  return `${inlineVideoUrl}${inlineVideoUrl.includes("?") ? "&" : "?"}download=1`;
}

async function fetchPresignedDownload(storedVideo: string): Promise<PresignedDownloadResponse> {
  const r2Key = parseR2VideoReference(storedVideo);
  if (!r2Key) {
    throw new Error("Missing R2 key.");
  }

  const response = await fetch("/api/admin/video-download-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ r2Key }),
  });

  if (!response.ok) {
    throw new Error("Unable to prepare video download.");
  }

  return (await response.json()) as PresignedDownloadResponse;
}

export default function AdminSubmissionVideoActions({
  storedVideo,
  inlineVideoUrl,
}: AdminSubmissionVideoActionsProps) {
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);

  const isR2Video = isR2VideoReference(storedVideo);

  useEffect(() => {
    setCanShareFiles(canShareVideoFiles());
  }, []);

  const openDownloadUrl = (downloadUrl: string) => {
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      if (isR2Video) {
        const presignedDownload = await fetchPresignedDownload(storedVideo);
        openDownloadUrl(presignedDownload.downloadUrl);
        return;
      }

      openDownloadUrl(getLegacyDownloadUrl(inlineVideoUrl));
    } catch {
      // Fail quietly for cancelled or blocked popups.
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToPhotos = async () => {
    if (!isR2Video || !canShareFiles) {
      return;
    }

    setIsPreparingShare(true);

    try {
      const presignedDownload = await fetchPresignedDownload(storedVideo);
      const response = await fetch(presignedDownload.downloadUrl);
      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const file = new File(
        [blob],
        presignedDownload.fileName,
        { type: presignedDownload.contentType || blob.type || "video/mp4" },
      );

      if (!navigator.canShare?.({ files: [file] })) {
        return;
      }

      await navigator.share({ files: [file] });
    } catch {
      // Fail quietly when sharing is cancelled or unavailable.
    } finally {
      setIsPreparingShare(false);
    }
  };

  return (
    <div className="border-t border-[#2b3650] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={isDownloading || isPreparingShare}
          className="inline-flex items-center justify-center rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDownloading ? "Preparing..." : "Download Video"}
        </button>

        {isR2Video && canShareFiles ? (
          <button
            type="button"
            onClick={() => void handleSaveToPhotos()}
            disabled={isDownloading || isPreparingShare}
            className="inline-flex items-center justify-center rounded-full border border-[#52B788]/60 px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPreparingShare ? "Preparing video..." : "Save to Photos"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
