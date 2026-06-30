"use client";

import { useEffect, useMemo, useState } from "react";

type VideoLibraryItem = {
  title: string;
  url: string;
};

const hittingVideos: VideoLibraryItem[] = [
  { title: "Coil into your load", url: "https://player.vimeo.com/video/1200422510" },
  { title: "Recreate this feeling", url: "https://player.vimeo.com/video/1200422513" },
  { title: "Med ball & tee combo #1", url: "https://player.vimeo.com/video/1200422511" },
  { title: "Med ball & tee combo #2", url: "https://player.vimeo.com/video/1200422512" },
  { title: "Stop casting your hands", url: "https://player.vimeo.com/video/1200422514" },
  { title: "Lead arm drill", url: "https://player.vimeo.com/video/1200422515" },
  { title: "Slot position", url: "https://player.vimeo.com/video/1200422517" },
  { title: "Posture work", url: "https://player.vimeo.com/video/1200422516" },
  { title: "Don't drift in your load", url: "https://player.vimeo.com/video/1200422500" },
];

const fieldingVideos: VideoLibraryItem[] = [
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

function autoplayUrl(url: string) {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set("autoplay", "1");
  parsedUrl.searchParams.set("title", "0");
  parsedUrl.searchParams.set("byline", "0");
  parsedUrl.searchParams.set("portrait", "0");
  return parsedUrl.toString();
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
            <div className="relative overflow-hidden rounded-xl border border-[#2b3650] bg-black">
              <div className="aspect-video w-full">
                <iframe
                  src={video.url}
                  title={video.title}
                  className="h-full w-full pointer-events-none"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 transition group-hover:bg-black/35">
                <span className="rounded-full border border-white/60 bg-black/60 px-4 py-2 text-xs font-semibold text-white sm:px-5 sm:text-sm">
                  Play Video
                </span>
              </div>
            </div>
              <p className="mt-4 text-base font-semibold text-zinc-100 sm:text-lg">{video.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VideoLibrary() {
  const [selectedVideo, setSelectedVideo] = useState<VideoLibraryItem | null>(null);

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
    () => (selectedVideo ? autoplayUrl(selectedVideo.url) : ""),
    [selectedVideo],
  );

  return (
    <>
      <section className="mt-10 space-y-8">
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
      </section>

      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative h-[78dvh] w-[96vw] sm:h-[80vh] sm:w-[85vw] lg:w-[80vw] max-w-6xl overflow-hidden rounded-2xl border border-[#2b3650] bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-zinc-100 transition hover:bg-black"
            >
              Close
            </button>
            <iframe
              src={modalUrl}
              title={selectedVideo.title}
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
