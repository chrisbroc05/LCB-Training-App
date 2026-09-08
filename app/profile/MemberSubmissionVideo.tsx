import { toVimeoEmbedUrl } from "@/lib/vimeo";
import {
  getStreamableR2VideoUrl,
  isR2VideoReference,
  parseR2VideoReference,
} from "@/lib/r2";

function canInlineSubmissionVideo(url: string) {
  return (
    url.startsWith("/api/submission-videos/") ||
    url.startsWith("/api/video/") ||
    (url.startsWith("http") && !url.includes("vimeo.com"))
  );
}

function resolveInlineVideoUrl(url: string) {
  if (isR2VideoReference(url)) {
    const key = parseR2VideoReference(url);
    return key ? getStreamableR2VideoUrl(key) : null;
  }

  return url;
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

    const inlineVideoUrl = resolveInlineVideoUrl(originalVideoUrl);
    if (inlineVideoUrl && canInlineSubmissionVideo(inlineVideoUrl)) {
      return (
        <div className="overflow-hidden rounded-xl border border-[#2b3650]">
          <video src={inlineVideoUrl} controls className="w-full rounded-lg">
            <source src={inlineVideoUrl} type="video/mp4" />
          </video>
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

export function CoachResponseVideo({ responseVideoUrl }: { responseVideoUrl: string }) {
  const vimeoEmbedUrl = toVimeoEmbedUrl(responseVideoUrl);
  if (vimeoEmbedUrl) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3650] pt-[56.25%]">
        <iframe
          src={vimeoEmbedUrl}
          title="Coach response video"
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const inlineVideoUrl = resolveInlineVideoUrl(responseVideoUrl);
  if (inlineVideoUrl && canInlineSubmissionVideo(inlineVideoUrl)) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#2b3650]">
        <video src={inlineVideoUrl} controls className="w-full rounded-lg">
          <source src={inlineVideoUrl} type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <a
      href={responseVideoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-[#8fd7ff] underline"
    >
      View Coach Video Response
    </a>
  );
}
