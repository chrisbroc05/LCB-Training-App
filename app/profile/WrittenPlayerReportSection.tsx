"use client";

import Link from "next/link";
import FocusDrillCards from "@/app/components/FocusDrillCards";
import { buildMemberPdfHref } from "@/lib/my-resources-shared";
import { formatWrittenReportLineForDisplay } from "@/lib/written-report-line-shared";

type WrittenPlayerReportSectionProps = {
  reportTitle: string;
  reportDateLabel: string;
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
  reportTitle,
  reportDateLabel,
  strengths,
  areasToImprove,
  recommendedDrillLines,
  noteFromCoach,
  libraryDrillIds,
  submissionId,
  hasEvaluationPdf,
  drillThumbnailMap,
}: WrittenPlayerReportSectionProps) {
  const openHref = buildMemberPdfHref({ kind: "evaluation", submissionId });
  const downloadHref = buildMemberPdfHref({ kind: "evaluation", submissionId, download: true });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold text-zinc-100">{reportTitle}</p>
        <p className="mt-1 text-xs text-zinc-400">{reportDateLabel}</p>
      </div>

      {hasEvaluationPdf ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href={openHref}
            className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black"
          >
            Open PDF
          </Link>
          <Link
            href={downloadHref}
            className="inline-flex rounded-full border border-[#2b3650] px-5 py-2.5 text-sm font-semibold text-zinc-100"
          >
            Download PDF
          </Link>
        </div>
      ) : null}

      <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
        <p className="text-sm font-semibold text-zinc-100">Strengths</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {strengths.map((line) => (
            <li key={line}>{formatWrittenReportLineForDisplay(line)}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
        <p className="text-sm font-semibold text-zinc-100">Areas to improve</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {areasToImprove.map((line) => (
            <li key={line}>{formatWrittenReportLineForDisplay(line)}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
        <p className="text-sm font-semibold text-zinc-100">Recommended drills</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {recommendedDrillLines.map((line) => (
            <li key={line}>{formatWrittenReportLineForDisplay(line)}</li>
          ))}
        </ul>
      </div>

      {noteFromCoach ? (
        <div className="rounded-xl border border-[#2b3650] bg-black/20 p-4">
          <p className="text-sm font-semibold text-zinc-100">Note from Coach Broc</p>
          <p className="mt-2 whitespace-pre-wrap text-sm italic text-zinc-300">
            {formatWrittenReportLineForDisplay(noteFromCoach)}
          </p>
        </div>
      ) : null}

      {libraryDrillIds.length > 0 ? (
        <FocusDrillCards drillIds={libraryDrillIds} thumbnailMap={drillThumbnailMap} />
      ) : null}
    </div>
  );
}
