import { resolveFixItDrillVideoByTitle } from "@/lib/fix-it-plans-shared";
import { buildDrillLibraryEmbedUrl } from "@/lib/vimeo";

type FixItVimeoEmbedProps = {
  videoTitle: string;
};

export default function FixItVimeoEmbed({ videoTitle }: FixItVimeoEmbedProps) {
  const video = resolveFixItDrillVideoByTitle(videoTitle);
  if (!video) {
    return null;
  }

  const embedUrl = buildDrillLibraryEmbedUrl(video.url);
  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-[#2b3650] bg-black">
      <iframe
        src={embedUrl}
        title={video.title}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
