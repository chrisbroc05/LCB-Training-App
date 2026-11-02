"use client";

import Link from "next/link";
import MemberPdfScrollViewer from "@/app/resources/view/MemberPdfScrollViewer";

type PdfResourceViewerClientProps = {
  title: string;
  pdfSrc: string;
  downloadHref: string;
  backHref: string;
};

export default function PdfResourceViewerClient({
  title,
  pdfSrc,
  downloadHref,
  backHref,
}: PdfResourceViewerClientProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A1628]">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#18243a] px-3 py-3 safe-area-inset-top sm:px-4">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-semibold text-[#52B788]"
        >
          Back
        </Link>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-medium text-zinc-100">
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={pdfSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#2b3650] px-3 text-xs font-semibold text-zinc-200"
          >
            Open PDF
          </a>
          <a
            href={downloadHref}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#52B788]/50 px-3 text-xs font-semibold text-[#52B788]"
          >
            Download
          </a>
        </div>
      </header>
      <MemberPdfScrollViewer pdfSrc={pdfSrc} title={title} />
    </div>
  );
}
