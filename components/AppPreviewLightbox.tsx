"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";

export type AppPreviewLightboxItem = {
  src: string;
  alt: string;
  caption: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
};

type AppPreviewLightboxProps = {
  item: AppPreviewLightboxItem | null;
  onClose: () => void;
};

export default function AppPreviewLightbox({ item, onClose }: AppPreviewLightboxProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!item) {
      return;
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [item, handleKeyDown]);

  if (!item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.caption}
        className="relative flex max-h-[92dvh] w-full max-w-[min(100%,420px)] flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-10 z-10 rounded-full border border-[#2b3650] bg-[#0b1324] px-3 py-1.5 text-sm font-medium text-zinc-200 shadow-lg hover:bg-[#18243a] sm:-right-2 sm:-top-12"
        >
          Close
        </button>
        <div className="overflow-auto rounded-2xl border border-[#2b3650] bg-[#050b16] shadow-2xl shadow-black/50">
          <Image
            src={item.src}
            alt={item.alt}
            width={item.intrinsicWidth}
            height={item.intrinsicHeight}
            className="h-auto w-full"
            sizes="420px"
            priority
          />
        </div>
        <p className="mt-3 text-center text-sm font-medium text-zinc-300">{item.caption}</p>
      </div>
    </div>
  );
}
