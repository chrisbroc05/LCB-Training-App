"use client";

import Link from "next/link";

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
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#18243a] px-4 py-3 safe-area-inset-top">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-semibold text-[#52B788]"
        >
          Back
        </Link>
        <p className="truncate px-2 text-sm font-medium text-zinc-100">{title}</p>
        <a
          href={downloadHref}
          className="inline-flex min-h-[44px] items-center rounded-full border border-[#52B788]/50 px-4 text-xs font-semibold text-[#52B788]"
        >
          Download
        </a>
      </header>
      <div className="min-h-0 flex-1">
        <iframe
          title={title}
          src={pdfSrc}
          className="h-full w-full border-0 bg-black"
        />
      </div>
    </div>
  );
}
