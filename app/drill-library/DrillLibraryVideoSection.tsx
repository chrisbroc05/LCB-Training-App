"use client";

import { useEffect, useState } from "react";
import VideoLibrary from "@/app/dashboard/VideoLibrary";

type DrillLibraryVideoSectionProps = {
  thumbnailMap: Record<string, string | null>;
};

function VideoLibrarySkeleton() {
  return (
    <section className="mt-6 space-y-4 px-4 md:hidden">
      <div className="mobile-filter-row">
        {["All", "Hitting", "Fielding", "Mindset"].map((label) => (
          <div
            key={label}
            className="mobile-filter-pill h-11 animate-pulse border-[#2b3650] bg-[#132038] text-transparent"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="mobile-card-stack">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="mobile-card animate-pulse">
            <div className="aspect-video w-full rounded-xl bg-[#132038]" />
            <div className="mt-3 h-4 w-3/4 rounded bg-[#132038]" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DrillLibraryVideoSection({ thumbnailMap }: DrillLibraryVideoSectionProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <VideoLibrarySkeleton />;
  }

  return <VideoLibrary thumbnailMap={thumbnailMap} />;
}
