import R2PresignedVideoPlayer from "@/app/components/R2PresignedVideoPlayer";
import { appendVideoPreviewTimeFragment } from "@/lib/video-playback-shared";
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
  posterR2Key,
}: {
  memberVimeoLink: string | null;
  originalVideoUrl: string | null;
  posterR2Key?: string | null;
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

    if (isR2VideoReference(originalVideoUrl)) {
      return (
        <div className="overflow-hidden rounded-xl border border-[#2b3650]">
          <R2PresignedVideoPlayer
            storedVideo={originalVideoUrl}
            posterR2Key={posterR2Key}
            title="Original submission video"
          />
        </div>
      );
    }

    const inlineVideoUrl = resolveInlineVideoUrl(originalVideoUrl);
    if (inlineVideoUrl && canInlineSubmissionVideo(inlineVideoUrl)) {
      return (
        <div className="overflow-hidden rounded-xl border border-[#2b3650]">
          <video
            src={appendVideoPreviewTimeFragment(inlineVideoUrl)}
            controls
            playsInline
            preload="metadata"
            className="mx-auto w-full max-w-full object-contain"
          />
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

export function CoachResponseVideo({
  responseVideoUrl,
  posterR2Key,
}: {
  responseVideoUrl: string;
  posterR2Key?: string | null;
}) {
  const vimeoEmbedUrl = toVimeoEmbedUrl(responseVideoUrl);
  if (vimeoEmbedUrl) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3650] pt-[56.25%]">
        <iframe
          src={vimeoEmbedUrl}
          title="Coach Broc response video"
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isR2VideoReference(responseVideoUrl)) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#2b3650]">
        <R2PresignedVideoPlayer
          storedVideo={responseVideoUrl}
          posterR2Key={posterR2Key}
          title="Coach Broc response video"
        />
      </div>
    );
  }

  const inlineVideoUrl = resolveInlineVideoUrl(responseVideoUrl);
  if (inlineVideoUrl && canInlineSubmissionVideo(inlineVideoUrl)) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#2b3650]">
        <video
          src={appendVideoPreviewTimeFragment(inlineVideoUrl)}
          controls
          playsInline
          preload="metadata"
          className="mx-auto w-full max-w-full object-contain"
        />
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
      View Coach Broc video response
    </a>
  );
}
