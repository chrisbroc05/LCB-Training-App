"use client";
import { adminFetchJson, readAdminJsonResponse } from "@/lib/admin-fetch-shared";

import { useEffect, useMemo, useState } from "react";
import R2PresignedVideoPlayer from "@/app/components/R2PresignedVideoPlayer";
import { formatDateTime } from "@/lib/format-date";
import { appendVideoPreviewTimeFragment } from "@/lib/video-playback-shared";
import { toVimeoEmbedUrl } from "@/lib/vimeo";
import {
  getStreamableR2VideoUrl,
  isR2VideoReference,
  parseR2VideoReference,
} from "@/lib/r2";

export type AdminWrittenReportSubmissionDetail = {
  id: string;
  playerName: string;
  userEmail: string;
  createdAt: string;
  pitchType?: string;
  handedness?: string;
  whereWasThis?: string | null;
  lookAtFocus?: string | null;
  videoCategory?: string | null;
  notes?: string;
  submittedVideo?: string;
  memberVimeoLink?: string | null;
  submittedVideoPosterR2Key?: string | null;
  poolLabel?: string | null;
  memberProfile?: {
    age: number | null;
    currentTeam: string | null;
    level: string | null;
  } | null;
};

type AdminWrittenReportSubmissionContextProps = {
  detail: AdminWrittenReportSubmissionDetail | null;
  loading: boolean;
  levelLabel: string;
  organizationName: string | null;
  teamName: string | null;
};

function canInlineSubmissionVideo(url: string) {
  return (
    url.startsWith("/api/submission-videos/") ||
    url.startsWith("/api/video/") ||
    url.startsWith("/api/admin/r2-video/") ||
    (url.startsWith("http") && !url.includes("vimeo.com"))
  );
}

function resolveInlineSubmissionVideoUrl(url: string) {
  if (isR2VideoReference(url)) {
    const key = parseR2VideoReference(url);
    return key ? getStreamableR2VideoUrl(key) : null;
  }

  return url;
}

function describeStoredVideo(raw: string | null | undefined): {
  stored: string | null;
  displayRaw: string | null;
  missingReason: string | null;
} {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return { stored: null, displayRaw: raw ?? null, missingReason: "File missing" };
  }

  return { stored: trimmed, displayRaw: trimmed, missingReason: null };
}

function RawVideoReference(props: { label: string; value: string }) {
  return (
    <p className="mt-2 break-all font-mono text-xs text-zinc-500">
      <span className="font-sans text-zinc-400">{props.label}: </span>
      {props.value}
    </p>
  );
}

function AdminSubmissionVideoLinkRow(props: {
  storedVideo: string;
  inlineVideoUrl: string | null;
  externalOpenUrl: string | null;
}) {
  const [openUrl, setOpenUrl] = useState<string | null>(props.externalOpenUrl);
  const [openError, setOpenError] = useState<string | null>(null);

  useEffect(() => {
    setOpenUrl(props.externalOpenUrl);
    setOpenError(null);

    if (props.externalOpenUrl) {
      return;
    }

    if (!isR2VideoReference(props.storedVideo)) {
      if (props.inlineVideoUrl) {
        setOpenUrl(props.inlineVideoUrl);
      }
      return;
    }

    const r2Key = parseR2VideoReference(props.storedVideo);
    if (!r2Key) {
      return;
    }

    let cancelled = false;
    void fetch("/api/video-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r2Key }),
    })
      .then(async (response) => {
        const parsed = await readAdminJsonResponse<{ playbackUrl: string }>(
          response,
          response.url || "/api/video-url",
          { context: "written-report-open-url", okUserMessage: "Unable to load video." },
        );
        if (!parsed.ok) {
          throw new Error(parsed.userMessage);
        }
        return parsed.data;
      })
      .then((payload) => {
        if (!cancelled) {
          setOpenUrl(payload.playbackUrl);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setOpenError(error instanceof Error ? error.message : "Unable to load video.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props.externalOpenUrl, props.inlineVideoUrl, props.storedVideo]);

  const downloadHref = useMemo(() => {
    if (props.inlineVideoUrl && !isR2VideoReference(props.storedVideo)) {
      return `${props.inlineVideoUrl}${props.inlineVideoUrl.includes("?") ? "&" : "?"}download=1`;
    }
    return null;
  }, [props.inlineVideoUrl, props.storedVideo]);

  const handleR2Download = async () => {
    const r2Key = parseR2VideoReference(props.storedVideo);
    if (!r2Key) {
      return;
    }

    const responseResult = await adminFetchJson("/api/admin/video-download-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r2Key }),
    });

    if (!responseResult.ok) {
      return;
    }

    const payload = (responseResult.data) as { downloadUrl: string };
    window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {openUrl ? (
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#8fd7ff] underline"
        >
          Open video in new tab
        </a>
      ) : openError ? (
        <span className="text-zinc-400">Open in new tab unavailable ({openError})</span>
      ) : (
        <span className="text-zinc-400">Preparing open link...</span>
      )}

      {isR2VideoReference(props.storedVideo) ? (
        <button
          type="button"
          onClick={() => void handleR2Download()}
          className="font-semibold text-[#8fd7ff] underline"
        >
          Download
        </button>
      ) : downloadHref ? (
        <a
          href={downloadHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#8fd7ff] underline"
        >
          Download
        </a>
      ) : props.externalOpenUrl ? (
        <a
          href={props.externalOpenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#8fd7ff] underline"
        >
          Download
        </a>
      ) : null}
    </div>
  );
}

function AdminWrittenReportSubmissionVideo(props: {
  memberVimeoLink: string | null | undefined;
  storedVideo: string | null;
  posterR2Key?: string | null;
}) {
  const memberEmbed = props.memberVimeoLink ? toVimeoEmbedUrl(props.memberVimeoLink) : null;
  if (memberEmbed) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
          <div className="aspect-video w-full">
            <iframe
              src={memberEmbed}
              title="Member submission video"
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <AdminSubmissionVideoLinkRow
          storedVideo={props.memberVimeoLink ?? ""}
          inlineVideoUrl={null}
          externalOpenUrl={props.memberVimeoLink ?? null}
        />
        {props.memberVimeoLink ? (
          <RawVideoReference label="Video link" value={props.memberVimeoLink} />
        ) : null}
      </div>
    );
  }

  const { stored, displayRaw, missingReason } = describeStoredVideo(props.storedVideo);
  if (!stored) {
    return (
      <div className="rounded-lg border border-[#2b3650] bg-[#0b1324]/70 p-4 text-sm text-zinc-300">
        <p>{missingReason ?? "No member submission video available."}</p>
        {displayRaw ? <RawVideoReference label="Stored value" value={displayRaw} /> : null}
      </div>
    );
  }

  const pastedEmbed = toVimeoEmbedUrl(stored);
  if (pastedEmbed) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
          <div className="aspect-video w-full">
            <iframe
              src={pastedEmbed}
              title="Member submission video"
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <AdminSubmissionVideoLinkRow storedVideo={stored} inlineVideoUrl={null} externalOpenUrl={stored} />
        <RawVideoReference label="Video link" value={stored} />
      </div>
    );
  }

  const inlineVideoUrl = resolveInlineSubmissionVideoUrl(stored);
  const canInline = inlineVideoUrl ? canInlineSubmissionVideo(inlineVideoUrl) : false;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
        <div className="aspect-video w-full">
          {isR2VideoReference(stored) ? (
            <R2PresignedVideoPlayer
              storedVideo={stored}
              posterR2Key={props.posterR2Key}
              title="Member submission video"
              rawReference={stored}
            />
          ) : canInline && inlineVideoUrl ? (
            <video
              src={appendVideoPreviewTimeFragment(inlineVideoUrl)}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-zinc-300">
              <p>Video cannot be embedded here. Use Open video in new tab below.</p>
              <RawVideoReference label="Video link" value={stored} />
            </div>
          )}
        </div>
      </div>
      <AdminSubmissionVideoLinkRow
        storedVideo={stored}
        inlineVideoUrl={inlineVideoUrl}
        externalOpenUrl={stored.startsWith("http") ? stored : null}
      />
      <RawVideoReference label="Stored video reference" value={stored} />
    </div>
  );
}

export default function AdminWrittenReportSubmissionContext(
  props: AdminWrittenReportSubmissionContextProps,
) {
  if (props.loading) {
    return <p className="text-sm text-zinc-400">Loading submission details...</p>;
  }

  if (!props.detail) {
    return (
      <p className="text-sm text-red-300">
        Unable to load submission details. Refresh the queue or try again.
      </p>
    );
  }

  const detail = props.detail;
  const profileAge = detail.memberProfile?.age;
  const teamLabel =
    props.teamName ?? detail.memberProfile?.currentTeam ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
        <h3 className="text-lg font-semibold text-zinc-100">Submission video</h3>
        <div className="mt-4">
          <AdminWrittenReportSubmissionVideo
            memberVimeoLink={detail.memberVimeoLink}
            storedVideo={detail.submittedVideo ?? null}
            posterR2Key={detail.submittedVideoPosterR2Key}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4 text-sm text-zinc-200">
        <h3 className="text-lg font-semibold text-zinc-100">Submission details</h3>
        <div className="mt-3 space-y-2">
          <p>
            <span className="font-semibold text-zinc-100">Player:</span> {detail.playerName}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Age:</span>{" "}
            {profileAge != null ? String(profileAge) : "Not on profile"}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Email:</span> {detail.userEmail}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Team / org:</span>{" "}
            {[props.organizationName, teamLabel].filter(Boolean).join(" | ") || "Not listed"}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Handedness:</span>{" "}
            {detail.handedness ?? "Not provided"}
          </p>
          {detail.whereWasThis ? (
            <p>
              <span className="font-semibold text-zinc-100">Where:</span> {detail.whereWasThis}
            </p>
          ) : null}
          {detail.videoCategory ? (
            <p>
              <span className="font-semibold text-zinc-100">Video type:</span>{" "}
              {detail.videoCategory === "FIELDING" ? "Fielding" : "Hitting"}
            </p>
          ) : null}
          {detail.lookAtFocus ? (
            <p>
              <span className="font-semibold text-zinc-100">What to look at:</span>{" "}
              {detail.lookAtFocus}
            </p>
          ) : null}
          {detail.pitchType ? (
            <p>
              <span className="font-semibold text-zinc-100">Pitch focus:</span> {detail.pitchType}
            </p>
          ) : null}
          <p className="whitespace-pre-wrap">
            <span className="font-semibold text-zinc-100">Player note:</span>{" "}
            {detail.notes?.trim() ? detail.notes : "None"}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Submitted:</span>{" "}
            {formatDateTime(detail.createdAt)}
          </p>
          <p>
            <span className="font-semibold text-zinc-100">Level:</span> {props.levelLabel}
            {detail.poolLabel ? ` (${detail.poolLabel})` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
