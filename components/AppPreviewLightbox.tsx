"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

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

const closeBtnTop = "calc(env(safe-area-inset-top, 0px) + 12px)";
const closeBtnRight = "calc(env(safe-area-inset-right, 0px) + 12px)";
const overlayPaddingTop = "calc(env(safe-area-inset-top, 0px) + 12px)";
const overlayPaddingBottom = "calc(env(safe-area-inset-bottom, 0px) + 12px)";
export default function AppPreviewLightbox({ item, onClose }: AppPreviewLightboxProps) {
  const scrollYRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

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
      return undefined;
    }

    scrollYRef.current = typeof window !== "undefined" ? window.scrollY : 0;
    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("position");
      document.body.style.removeProperty("top");
      document.body.style.removeProperty("left");
      document.body.style.removeProperty("right");
      document.body.style.removeProperty("width");
      window.scrollTo(0, scrollYRef.current);
    };
  }, [item, handleKeyDown]);

  if (!item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/90"
      style={{
        paddingTop: overlayPaddingTop,
        paddingBottom: overlayPaddingBottom,
        paddingLeft: `max(12px, env(safe-area-inset-left, 0px))`,
        paddingRight: `max(12px, env(safe-area-inset-right, 0px))`,
      }}
      role="presentation"
      onClick={onClose}
      onTouchStart={(event) => {
        touchStartYRef.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartYRef.current;
        const end = event.changedTouches[0]?.clientY;
        touchStartYRef.current = null;
        if (start !== null && end !== undefined && end - start > 56) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="pointer-events-auto absolute z-[110] flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm hover:bg-black/70"
        style={{ top: closeBtnTop, right: closeBtnRight }}
        aria-label="Close preview"
      >
        <span className="text-2xl font-light leading-none" aria-hidden="true">
          x
        </span>
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.caption}
        className="flex max-h-full w-full max-w-[min(100%,420px)] cursor-default flex-col items-center"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          touchStartYRef.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartYRef.current;
          const end = event.changedTouches[0]?.clientY;
          touchStartYRef.current = null;
          if (start !== null && end !== undefined && end - start > 56) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="relative w-full">
            <Image
              src={item.src}
              alt={item.alt}
              width={item.intrinsicWidth}
              height={item.intrinsicHeight}
              className="h-auto max-h-[min(72dvh,calc(100dvh-8rem))] w-full object-contain"
              sizes="(max-width: 420px) 100vw, 420px"
              priority
            />
          </div>
        </div>
        <p className="mt-3 max-w-full shrink-0 text-center text-sm font-medium text-zinc-300">
          {item.caption}
        </p>
      </div>
    </div>
  );
}
