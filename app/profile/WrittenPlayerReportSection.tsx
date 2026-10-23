"use client";

import { useState } from "react";
import FocusDrillCards from "@/app/components/FocusDrillCards";

type WrittenPlayerReportSectionProps = {
  strengths: string[];
  areasToImprove: string[];
  recommendedDrillLines: string[];
  noteFromCoach: string | null;
  libraryDrillIds: string[];
  submissionId: string;
  hasEvaluationPdf: boolean;
  drillThumbnailMap: Record<string, string | null>;
};

export default function WrittenPlayerReportSection({
  strengths,
  areasToImprove,
  recommendedDrillLines,
  noteFromCoach,
  libraryDrillIds,
  submissionId,
  hasEvaluationPdf,
  drillThumbnailMap,
}: WrittenPlayerReportSectionProps) {
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    const response = await fetch(
      `/api/player-evaluations/download?submissionId=${encodeURIComponent(submissionId)}`,
    );
    setDownloading(false);
    const data = (await response.json().catch(() => ({}))) as {
      downloadUrl?: string;
      error?: string;
    };
    if (!response.ok || !data.downloadUrl) {
      setDownloadError(data.error ?? "Unable to download PDF.");
      return;
    }
    window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
        <p className="text-sm font-semibold text-zinc-100">Strengths</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {strengths.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
        <p className="text-sm font-semibold text-zinc-100">Areas to improve</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {areasToImprove.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
        <p className="text-sm font-semibold text-zinc-100">Recommended drills</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {recommendedDrillLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {noteFromCoach ? (
        <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
          <p className="text-sm font-semibold text-zinc-100">Note from Coach Broc</p>
          <p className="mt-2 whitespace-pre-wrap text-sm italic text-zinc-300">{noteFromCoach}</p>
        </div>
      ) : null}

      {libraryDrillIds.length > 0 ? (
        <FocusDrillCards drillIds={libraryDrillIds} thumbnailMap={drillThumbnailMap} />
      ) : null}

      {hasEvaluationPdf ? (
        <div>
          <button
            type="button"
            disabled={downloading}
            onClick={() => void handleDownload()}
            className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
          >
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </button>
          {downloadError ? <p className="mt-2 text-sm text-red-300">{downloadError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
