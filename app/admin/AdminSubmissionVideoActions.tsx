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

const SHARE_PREPARE_ERROR_MESSAGE = "Could not prepare video. Try Download Video instead.";

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

function fetchVideoBlobWithProgress(
  url: string,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";

    xhr.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof Blob) {
        onProgress(100);
        resolve(xhr.response);
        return;
      }

      reject(new Error(`Download failed with status ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Download failed"));
    };

    xhr.onabort = () => {
      reject(new Error("Download aborted"));
    };

    xhr.send();
  });
}

export default function AdminSubmissionVideoActions({
  storedVideo,
  inlineVideoUrl,
}: AdminSubmissionVideoActionsProps) {
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [sharePrepareProgress, setSharePrepareProgress] = useState<number | null>(null);
  const [preparedShareFile, setPreparedShareFile] = useState<File | null>(null);
  const [sharePrepareError, setSharePrepareError] = useState<string | null>(null);

  const isR2Video = isR2VideoReference(storedVideo);

  useEffect(() => {
    setCanShareFiles(canShareVideoFiles());
  }, []);

  useEffect(() => {
    setPreparedShareFile(null);
    setSharePrepareProgress(null);
    setSharePrepareError(null);
    setIsPreparingShare(false);
  }, [storedVideo]);

  const openDownloadUrl = (downloadUrl: string) => {
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setSharePrepareError(null);

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

  const prepareShareFile = async () => {
    if (!isR2Video || !canShareFiles) {
      return;
    }

    setSharePrepareError(null);
    setPreparedShareFile(null);
    setSharePrepareProgress(0);
    setIsPreparingShare(true);

    try {
      const presignedDownload = await fetchPresignedDownload(storedVideo);
      const blob = await fetchVideoBlobWithProgress(
        presignedDownload.downloadUrl,
        setSharePrepareProgress,
      );
      const file = new File(
        [blob],
        presignedDownload.fileName,
        { type: presignedDownload.contentType || blob.type || "video/mp4" },
      );

      if (!navigator.canShare?.({ files: [file] })) {
        setSharePrepareError(SHARE_PREPARE_ERROR_MESSAGE);
        return;
      }

      setPreparedShareFile(file);
    } catch {
      setSharePrepareError(SHARE_PREPARE_ERROR_MESSAGE);
    } finally {
      setIsPreparingShare(false);
      setSharePrepareProgress(null);
    }
  };

  const handleSaveToPhotosClick = () => {
    if (preparedShareFile) {
      try {
        if (!navigator.canShare?.({ files: [preparedShareFile] })) {
          return;
        }

        void navigator.share({ files: [preparedShareFile] });
      } catch {
        // Fail quietly when sharing is cancelled.
      }
      return;
    }

    void prepareShareFile();
  };

  const saveToPhotosLabel = (() => {
    if (preparedShareFile) {
      return "Tap to Save";
    }

    if (isPreparingShare) {
      return sharePrepareProgress !== null
        ? `Preparing video... ${sharePrepareProgress}%`
        : "Preparing video...";
    }

    return "Save to Photos";
  })();

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
            onClick={handleSaveToPhotosClick}
            disabled={isDownloading || isPreparingShare}
            className="inline-flex items-center justify-center rounded-full border border-[#52B788]/60 px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveToPhotosLabel}
          </button>
        ) : null}
      </div>

      {isPreparingShare && sharePrepareProgress !== null ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-[#1a253a]">
            <div
              className="h-full rounded-full bg-[#52B788] transition-all duration-150"
              style={{ width: `${sharePrepareProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {sharePrepareError ? (
        <p className="mt-3 text-sm text-red-300">{sharePrepareError}</p>
      ) : null}
    </div>
  );
}
