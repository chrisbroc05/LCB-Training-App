"use client";

import { useEffect, useRef, useState } from "react";

type MemberPdfScrollViewerProps = {
  pdfSrc: string;
  title: string;
};

export default function MemberPdfScrollViewer({ pdfSrc, title }: MemberPdfScrollViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const pagesRoot = scrollRef.current;
    if (!pagesRoot) {
      return;
    }
    const mount = pagesRoot;

    async function renderPdf() {
      setStatus("loading");
      mount.innerHTML = "";

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

        const pdf = await pdfjs.getDocument({ url: pdfSrc, withCredentials: true }).promise;
        if (cancelled) {
          return;
        }

        setPageCount(pdf.numPages);
        const containerWidth = mount.clientWidth || window.innerWidth;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          if (cancelled) {
            return;
          }
          const page = await pdf.getPage(pageNum);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.max(0.1, (containerWidth - 8) / baseViewport.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = "mx-auto mb-4 max-w-full bg-white shadow-lg";

          const context = canvas.getContext("2d");
          if (!context) {
            continue;
          }

          await page.render({ canvasContext: context, viewport }).promise;

          const wrap = document.createElement("div");
          wrap.className = "flex w-full justify-center";
          wrap.appendChild(canvas);
          mount.appendChild(wrap);
        }

        if (!cancelled) {
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
    };
  }, [pdfSrc]);

  if (status === "error") {
    return (
      <p className="px-4 py-8 text-center text-sm text-zinc-400">
        Could not load this PDF in the app. Use Download or Open PDF below.
      </p>
    );
  }

  return (
    <>
      {status === "loading" ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-400">Loading PDF...</p>
      ) : null}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-3 touch-pan-y"
        aria-busy={status === "loading"}
        aria-label={title}
      />
      {status === "ready" && pageCount > 0 ? (
        <p className="shrink-0 pb-3 text-center text-xs text-zinc-500">{pageCount} pages</p>
      ) : null}
    </>
  );
}
