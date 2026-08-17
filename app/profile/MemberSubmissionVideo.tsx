import { toVimeoEmbedUrl } from "@/lib/vimeo";

function canInlineSubmissionVideo(url: string) {
  return (
    url.startsWith("/api/submission-videos/") ||
    (url.startsWith("http") && !url.includes("vimeo.com"))
  );
}

export default function MemberSubmissionVideo({
  memberVimeoLink,
  originalVideoUrl,
}: {
  memberVimeoLink: string | null;
  originalVideoUrl: string | null;
}) {
  if (memberVimeoLink) {
    const embedUrl = toVimeoEmbedUrl(memberVimeoLink);
    if (embedUrl) {
      return (
        <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3650] pt-[56.25%]">
          <iframe
            src={embedUrl}
            title="Original submission video"
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  if (originalVideoUrl) {
    const originalEmbedUrl = toVimeoEmbedUrl(originalVideoUrl);
    if (originalEmbedUrl) {
      return (
        <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3650] pt-[56.25%]">
          <iframe
            src={originalEmbedUrl}
            title="Original submission video"
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (canInlineSubmissionVideo(originalVideoUrl)) {
      return (
        <div className="overflow-hidden rounded-xl border border-[#2b3650]">
          <video src={originalVideoUrl} controls className="w-full" />
        </div>
      );
    }

    return (
      <a
        href={originalVideoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[#8fd7ff] underline"
      >
        View Original Video
      </a>
    );
  }

  return (
    <p className="text-sm text-zinc-400">Video unavailable -- please resubmit if needed</p>
  );
}
