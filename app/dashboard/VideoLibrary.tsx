"use client";

import { useEffect, useMemo, useState } from "react";
import MobileBottomSheet from "@/app/components/mobile/MobileBottomSheet";
import { useIsMobile } from "@/app/components/mobile/useIsMobile";

type VideoLibraryItem = {
  title: string;
  url: string;
  category: "hitting" | "fielding" | "mindset";
};

type VideoLibrarySourceItem = {
  title: string;
  url: string;
};

const hittingVideoSources: VideoLibrarySourceItem[] = [
  { title: "Coil into your load", url: "https://player.vimeo.com/video/1200422510" },
  { title: "Recreate this feeling", url: "https://player.vimeo.com/video/1200422513" },
  { title: "Med ball & tee combo #1", url: "https://player.vimeo.com/video/1200422511" },
  { title: "Med ball & tee combo #2", url: "https://player.vimeo.com/video/1200422512" },
  { title: "Stop casting your hands", url: "https://player.vimeo.com/video/1200422514" },
  { title: "Lead arm drill", url: "https://player.vimeo.com/video/1200422515" },
  { title: "Slot position", url: "https://player.vimeo.com/video/1200422517" },
  { title: "Posture work", url: "https://player.vimeo.com/video/1200422516" },
  { title: "Don't drift in your load", url: "https://player.vimeo.com/video/1200422500" },
  { title: "PVC Pipe/Light Bat Swings", url: "https://player.vimeo.com/video/1207507965" },
  { title: "Top Hand - High Tee Drill", url: "https://player.vimeo.com/video/1207509269" },
  { title: "Half Bat Drill", url: "https://player.vimeo.com/video/1207510044" },
  { title: "Low Tee - Outside Pitch", url: "https://player.vimeo.com/video/1207511052" },
  { title: "45 Degree Angled In", url: "https://player.vimeo.com/video/1207512012" },
  { title: "45 Degree Drill - Angled Out", url: "https://player.vimeo.com/video/1207513205" },
  {
    title: "Staying Stacked in Our Back Leg",
    url: "https://player.vimeo.com/video/1207514238",
  },
  {
    title: "Be Able to Hit These 3 Pitches",
    url: "https://player.vimeo.com/video/1207516198",
  },
];

const hittingVideos: VideoLibraryItem[] = hittingVideoSources.map((video) => ({
  ...video,
  category: "hitting",
}));

const fieldingVideoSources: VideoLibrarySourceItem[] = [
  { title: "Do these everyday", url: "https://player.vimeo.com/video/1200425708" },
  {
    title: "4 drills you can do with just a glove, ball and bucket",
    url: "https://player.vimeo.com/video/1200425698",
  },
  { title: "Make plays on the run", url: "https://player.vimeo.com/video/1200425704" },
  { title: "Body control", url: "https://player.vimeo.com/video/1200425706" },
  {
    title: "Timing and getting around the baseball",
    url: "https://player.vimeo.com/video/1200425705",
  },
  {
    title: "3 drills to improve footwork and timing",
    url: "https://player.vimeo.com/video/1200425707",
  },
  { title: "Daily Progressions", url: "https://player.vimeo.com/video/1205918751" },
  {
    title: "Daily Progressions (Short Hops)",
    url: "https://player.vimeo.com/video/1205918743",
  },
  { title: "Forehand Footwork", url: "https://player.vimeo.com/video/1205921603" },
  { title: "Fielding Timing (2 Cones)", url: "https://player.vimeo.com/video/1205921606" },
  {
    title: "Backhand Progression (2 Cones)",
    url: "https://player.vimeo.com/video/1205921604",
  },
  { title: "Fielding Timing", url: "https://player.vimeo.com/video/1205921593" },
  {
    title: "Backhand Timing Drill (One Cone)",
    url: "https://player.vimeo.com/video/1205921605",
  },
  {
    title: "How These Drills Translate to the Game",
    url: "https://player.vimeo.com/video/1205924083",
  },
  { title: "Backhand Footwork", url: "https://player.vimeo.com/video/1205924081" },
  {
    title: "Getting Around the Baseball Drill",
    url: "https://player.vimeo.com/video/1205924082",
  },
  { title: "Quick Feet Drill", url: "https://player.vimeo.com/video/1205924080" },
  { title: "Backhand Footwork Drill", url: "https://player.vimeo.com/video/1205924073" },
];

const fieldingVideos: VideoLibraryItem[] = fieldingVideoSources.map((video) => ({
  ...video,
  category: "fielding",
}));

const mindsetVideoSources: VideoLibrarySourceItem[] = [
  { title: "Take Your Mobility Serious", url: "https://player.vimeo.com/video/1210519237" },
  {
    title: "You Don't Have to Be the Biggest Player on the Team",
    url: "https://player.vimeo.com/video/1210519236",
  },
  { title: "Ask Questions and Be Curious", url: "https://player.vimeo.com/video/1210519239" },
  {
    title: "Dominate the Level You're At Right Now",
    url: "https://player.vimeo.com/video/1210519241",
  },
  { title: "Put the Work In", url: "https://player.vimeo.com/video/1210519240" },
  {
    title: "Don't Worry About Mechanics in the Game",
    url: "https://player.vimeo.com/video/1210519242",
  },
  {
    title: "Develop Consistency and Discipline",
    url: "https://player.vimeo.com/video/1210519238",
  },
  { title: "Clear Your Mind", url: "https://player.vimeo.com/video/1210519230" },
  { title: "Take Pride in Failure", url: "https://player.vimeo.com/video/1210521781" },
  { title: "Trust the Training", url: "https://player.vimeo.com/video/1210521780" },
  {
    title: "Don't Make This Game Harder Than It Needs to Be",
    url: "https://player.vimeo.com/video/1210521772",
  },
];

const mindsetVideos: VideoLibraryItem[] = mindsetVideoSources.map((video) => ({
  ...video,
  category: "mindset",
}));

const drillCategories = [
  { key: "all", label: "All" },
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "mindset", label: "Mindset" },
] as const;

type DrillCategoryFilter = (typeof drillCategories)[number]["key"];

const allVideos = [...hittingVideos, ...fieldingVideos, ...mindsetVideos];

const drillLibraryEmbedParams = {
  title: "0",
  byline: "0",
  portrait: "0",
  dnt: "1",
  transparent: "0",
  rel: "0",
} as const;

function buildDrillLibraryEmbedUrl(url: string, options?: { autoplay?: boolean }) {
  const parsedUrl = new URL(url);

  Object.entries(drillLibraryEmbedParams).forEach(([key, value]) => {
    parsedUrl.searchParams.set(key, value);
  });

  if (options?.autoplay) {
    parsedUrl.searchParams.set("autoplay", "1");
  }

  return parsedUrl.toString();
}

function PlayGlyph({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5v14l11-7-11-7Z" />
      </svg>
    );
  }

  return (
    <span className="rounded-full border border-white/60 bg-black/60 px-4 py-2 text-xs font-semibold text-white sm:px-5 sm:text-sm">
      Play Video
    </span>
  );
}

function VideoThumbnailPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#2b3650] bg-[#0b1324]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f1d34_0%,#152238_55%,#0b1324_100%)]" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <span
          className={
            compact
              ? "inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#52B788] text-[#0A1628]"
              : "inline-flex items-center justify-center"
          }
        >
          <PlayGlyph compact={compact} />
        </span>
      </div>
    </div>
  );
}

type VideoSectionProps = {
  heading: string;
  description: string;
  videos: VideoLibraryItem[];
  onSelectVideo: (video: VideoLibraryItem) => void;
};

function VideoSection({ heading, description, videos, onSelectVideo }: VideoSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{heading}</h2>
      <p className="mt-2 text-zinc-300">{description}</p>
      <div className="mt-6 grid gap-5 sm:gap-6 lg:grid-cols-2">
        {videos.map((video) => (
          <button
            key={video.url}
            type="button"
            onClick={() => onSelectVideo(video)}
            className="group rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 text-left transition hover:border-[#2b7c4b] hover:bg-[#11203a] sm:p-6"
          >
            <VideoThumbnailPlaceholder />
            <p className="mt-4 text-base font-semibold text-zinc-100 sm:text-lg">{video.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VideoLibrary() {
  const [selectedVideo, setSelectedVideo] = useState<VideoLibraryItem | null>(null);
  const [mobileCategory, setMobileCategory] = useState<DrillCategoryFilter>("all");
  const isMobile = useIsMobile();

  const filteredMobileVideos = useMemo(() => {
    if (mobileCategory === "all") {
      return allVideos;
    }

    return allVideos.filter((video) => video.category === mobileCategory);
  }, [mobileCategory]);

  useEffect(() => {
    if (!selectedVideo) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedVideo(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedVideo]);

  const modalUrl = useMemo(
    () =>
      selectedVideo ? buildDrillLibraryEmbedUrl(selectedVideo.url, { autoplay: true }) : "",
    [selectedVideo],
  );

  return (
    <>
      <section className="mt-6 space-y-4 px-4 md:hidden">
        <div className="mobile-filter-row">
          {drillCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setMobileCategory(category.key)}
              className={`mobile-filter-pill ${mobileCategory === category.key ? "is-active" : ""}`}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="mobile-card-stack">
          {filteredMobileVideos.map((video) => (
            <button
              key={video.url}
              type="button"
              onClick={() => setSelectedVideo(video)}
              className="mobile-card text-left"
            >
              <VideoThumbnailPlaceholder compact />
              <p className="mt-3 text-base font-semibold text-zinc-100">{video.title}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 hidden space-y-8 md:block">
        <VideoSection
          heading="Hitting Library"
          description="Drill demonstrations for swing mechanics, load, posture, and bat path."
          videos={hittingVideos}
          onSelectVideo={setSelectedVideo}
        />
        <VideoSection
          heading="Fielding Library"
          description="Defensive drill work for control, timing, footwork, and making game-speed plays."
          videos={fieldingVideos}
          onSelectVideo={setSelectedVideo}
        />
        <VideoSection
          heading="Mindset Library"
          description="Mental performance lessons to build confidence, focus, and composure."
          videos={mindsetVideos}
          onSelectVideo={setSelectedVideo}
        />
      </section>

      {selectedVideo && isMobile ? (
        <MobileBottomSheet
          open={Boolean(selectedVideo)}
          onClose={() => setSelectedVideo(null)}
          title={selectedVideo.title}
        >
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-[#2b3650] bg-black">
            {modalUrl ? (
              <iframe
                src={modalUrl}
                title={selectedVideo.title}
                className="h-full w-full"
                allow="fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : null}
          </div>
        </MobileBottomSheet>
      ) : null}

      {selectedVideo && !isMobile ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative h-[78dvh] w-[96vw] max-w-6xl overflow-hidden rounded-2xl border border-[#2b3650] bg-black shadow-2xl sm:h-[80vh] sm:w-[85vw] lg:w-[80vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-zinc-100 transition hover:bg-black"
            >
              Close
            </button>
            {modalUrl ? (
              <iframe
                src={modalUrl}
                title={selectedVideo.title}
                className="h-full w-full"
                allow="fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
