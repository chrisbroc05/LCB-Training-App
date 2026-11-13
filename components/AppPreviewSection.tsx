"use client";

import Image from "next/image";
import { useState } from "react";
import AppPreviewLightbox, { type AppPreviewLightboxItem } from "@/components/AppPreviewLightbox";

const PHONE_WIDTH = 750;
const PHONE_HEIGHT = 1624;
const SWING_REPORT_HEIGHT = 1638;

const previews = [
  {
    src: "/images/app-preview/weekly-team-focus.webp",
    alt: "LCB Training app home screen showing a weekly team focus and Coach Broc drill videos",
    caption: "A weekly focus with my drill videos",
    intrinsicWidth: PHONE_WIDTH,
    intrinsicHeight: PHONE_HEIGHT,
  },
  {
    src: "/images/app-preview/swing-report-app.webp",
    alt: "Swing report from Coach Broc in the LCB Training app",
    caption: "A personal swing report from me",
    intrinsicWidth: PHONE_WIDTH,
    intrinsicHeight: SWING_REPORT_HEIGHT,
  },
  {
    src: "/images/app-preview/daily-plan.webp",
    alt: "LCB Training Today screen with a personalized daily hitting plan and recommended drills",
    caption: "A daily plan built for you",
    intrinsicWidth: PHONE_WIDTH,
    intrinsicHeight: PHONE_HEIGHT,
  },
] as const;

type Preview = (typeof previews)[number];

function PhoneFrame({ preview, onOpen }: { preview: Preview; onOpen: (item: AppPreviewLightboxItem) => void }) {
  const { src, alt, caption, intrinsicWidth, intrinsicHeight } = preview;

  return (
    <figure className="mx-auto flex w-full max-w-[280px] flex-col sm:max-w-none">
      <button
        type="button"
        onClick={() =>
          onOpen({ src, alt, caption, intrinsicWidth, intrinsicHeight })
        }
        className="group rounded-[2rem] border border-[#2b3650] bg-[#050b16] p-2 text-left shadow-2xl shadow-black/50 transition hover:border-[#3d4f6f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] sm:rounded-[2.25rem] sm:p-2.5"
        aria-label={`View larger: ${caption}`}
      >
        <div
          className="relative overflow-hidden rounded-[1.6rem] border border-[#18243a] bg-[#050b16] sm:rounded-[1.85rem]"
          style={{ aspectRatio: `${PHONE_WIDTH} / ${PHONE_HEIGHT}` }}
        >
          <Image
            src={src}
            alt={alt}
            width={intrinsicWidth}
            height={intrinsicHeight}
            className="h-full w-full object-cover object-[center_top]"
            sizes="(max-width: 640px) 280px, (max-width: 1024px) 30vw, 280px"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent py-2 text-center text-xs font-medium text-zinc-200 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            Tap to enlarge
          </span>
        </div>
      </button>
      <figcaption className="mt-4 min-h-[3rem] text-center text-sm font-medium text-zinc-200 sm:text-base">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function AppPreviewSection() {
  const [lightboxItem, setLightboxItem] = useState<AppPreviewLightboxItem | null>(null);

  return (
    <section className="border-t border-[#18243a] bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">What you get in the app</h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-400 sm:text-lg">
            A daily plan, real swing feedback, and structure for the days in between practices and
            lessons.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 items-start gap-10 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {previews.map((preview) => (
            <PhoneFrame key={preview.src} preview={preview} onOpen={setLightboxItem} />
          ))}
        </div>
      </div>
      <AppPreviewLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </section>
  );
}
