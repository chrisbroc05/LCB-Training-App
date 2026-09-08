"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GoalCheckinsPanel from "@/app/admin/GoalCheckinsPanel";
import MembersPanel from "@/app/admin/MembersPanel";
import PlaybookReflectionsPanel from "@/app/admin/PlaybookReflectionsPanel";
import MemberProfileCard from "@/app/admin/MemberProfileCard";
import { toVimeoEmbedUrl } from "@/lib/vimeo";
import { getStreamableR2VideoUrl, isR2VideoReference, parseR2VideoReference } from "@/lib/r2";

type TabType = "swing" | "mental" | "goal" | "members" | "playbook";

type SubmissionListItem = {
  id: string;
  playerName: string;
  topic?: string | null;
  createdAt: string;
  userEmail: string;
  badgeStatus: "PENDING" | "RESPONDED";
  hasMemberVimeoLink?: boolean;
};

type MemberProfileSummary = {
  hasProfile: boolean;
  position: string | null;
  age: number | null;
  graduationYear: number | null;
  currentTeam: string | null;
  level: string | null;
  playerBio: string | null;
};

type SubmissionDetail = SubmissionListItem & {
  pitchType?: string;
  handedness?: string;
  notes?: string;
  submittedVideo?: string;
  playerAge?: string;
  message?: string;
  videoPath?: string | null;
  responsePreference?: "VIDEO_RESPONSE" | "WRITTEN_RESPONSE";
  responseText?: string | null;
  responseVideoUrl?: string | null;
  respondedAt?: string | null;
  memberVimeoLink?: string | null;
  memberProfile?: MemberProfileSummary;
};

function formatResponseDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function canInlineResponseVideo(url: string) {
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

function getResponseVideoDisplayName(url: string | null | undefined) {
  if (!url || !isR2VideoReference(url)) {
    return null;
  }

  const key = parseR2VideoReference(url);
  if (!key) {
    return "Response video";
  }

  const segment = key.split("/").pop() ?? "Response video";
  const dashIndex = segment.indexOf("-");
  if (dashIndex > 0 && /^\d+$/.test(segment.slice(0, dashIndex))) {
    return segment.slice(dashIndex + 1);
  }

  return segment;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<TabType>("swing");
  const [items, setItems] = useState<SubmissionListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [writtenResponse, setWrittenResponse] = useState("");
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [showVimeoInput, setShowVimeoInput] = useState(false);
  const [uploadedResponseFileName, setUploadedResponseFileName] = useState("");
  const [responseVideoInputKey, setResponseVideoInputKey] = useState(0);
  const responseVideoInputRef = useRef<HTMLInputElement>(null);
  const [sendError, setSendError] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseSummary, setResponseSummary] = useState("");
  const [memberVimeoLinkInput, setMemberVimeoLinkInput] = useState("");
  const [memberVimeoSaveError, setMemberVimeoSaveError] = useState("");
  const [memberVimeoSaveSuccess, setMemberVimeoSaveSuccess] = useState(false);
  const [savingMemberVimeoLink, setSavingMemberVimeoLink] = useState(false);
  const [memberVimeoPlayerKey, setMemberVimeoPlayerKey] = useState(0);
  const [editingMemberVimeoLink, setEditingMemberVimeoLink] = useState(true);
  const [uploadingResponseR2, setUploadingResponseR2] = useState(false);
  const [responseR2UploadError, setResponseR2UploadError] = useState("");
  const [responseR2UploadSuccess, setResponseR2UploadSuccess] = useState(false);

  useEffect(() => {
    if (tab === "goal" || tab === "members" || tab === "playbook") {
      return;
    }

    const loadList = async () => {
      setLoadingList(true);
      const response = await fetch(`/api/admin/submissions?type=${tab}`);
      setLoadingList(false);
      if (!response.ok) {
        setItems([]);
        return;
      }

      const data = (await response.json()) as { submissions: SubmissionListItem[] };
      setItems(data.submissions);
      setSelectedId(null);
      setDetail(null);
      setSendError("");
      setShowResponseModal(false);
      setResponseSummary("");
    };

    void loadList();
  }, [tab]);

  useEffect(() => {
    if (tab === "goal" || !selectedId) {
      return;
    }

    const loadDetail = async () => {
      setLoadingDetail(true);
      const response = await fetch(`/api/admin/submissions/${tab}/${selectedId}`);
      setLoadingDetail(false);
      if (!response.ok) {
        setDetail(null);
        return;
      }
      const data = (await response.json()) as { submission: SubmissionDetail };
      setDetail(data.submission);
      setMemberVimeoLinkInput(data.submission.memberVimeoLink ?? "");
      setMemberVimeoSaveError("");
      setMemberVimeoSaveSuccess(false);
      setEditingMemberVimeoLink(!data.submission.memberVimeoLink);
      setWrittenResponse("");
      setManualVideoUrl("");
      setShowVimeoInput(false);
      setUploadedResponseFileName("");
      setResponseVideoInputKey((current) => current + 1);
      setSendError("");
      setShowResponseModal(false);
      setResponseSummary("");
      setResponseR2UploadError("");
      setResponseR2UploadSuccess(false);
    };

    void loadDetail();
  }, [selectedId, tab]);

  const memberVimeoEmbedUrl = detail?.memberVimeoLink ? toVimeoEmbedUrl(detail.memberVimeoLink) : null;
  const coachVimeoEmbedUrl = manualVideoUrl.trim() ? toVimeoEmbedUrl(manualVideoUrl) : null;

  const hasUploadedR2Video = detail?.responseVideoUrl
    ? isR2VideoReference(detail.responseVideoUrl)
    : false;
  const responseVideoDisplayName =
    uploadedResponseFileName || getResponseVideoDisplayName(detail?.responseVideoUrl);
  const hasResponseVideoReady = hasUploadedR2Video || Boolean(uploadedResponseFileName);
  const canSendResponse = Boolean(
    writtenResponse.trim() || hasUploadedR2Video || manualVideoUrl.trim(),
  );

  const fallbackVideoUrl = useMemo(() => {
    if (!detail) {
      return null;
    }

    const storedVideo = detail.submittedVideo || detail.videoPath || null;
    if (!storedVideo) {
      return null;
    }

    return resolveInlineSubmissionVideoUrl(storedVideo);
  }, [detail]);

  const canInlineFallbackVideo = fallbackVideoUrl ? canInlineResponseVideo(fallbackVideoUrl) : false;

  const handleSaveMemberVimeoLink = async () => {
    if (!detail) {
      return;
    }

    setMemberVimeoSaveError("");
    setMemberVimeoSaveSuccess(false);
    setSavingMemberVimeoLink(true);

    const response = await fetch("/api/admin/submission-vimeo-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: detail.id,
        submissionType: tab,
        vimeoLink: memberVimeoLinkInput.trim(),
      }),
    });

    if (!response.ok) {
      setSavingMemberVimeoLink(false);
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setMemberVimeoSaveError(data.error ?? "Unable to save member Vimeo link.");
      return;
    }

    const data = (await response.json()) as { memberVimeoLink?: string };
    const savedLink = data.memberVimeoLink ?? memberVimeoLinkInput.trim();

    const refreshed = await fetch(`/api/admin/submissions/${tab}/${detail.id}`);
    if (refreshed.ok) {
      const refreshData = (await refreshed.json()) as { submission: SubmissionDetail };
      setDetail(refreshData.submission);
      setMemberVimeoLinkInput(refreshData.submission.memberVimeoLink ?? savedLink);
    } else {
      setDetail({
        ...detail,
        memberVimeoLink: savedLink,
      });
      setMemberVimeoLinkInput(savedLink);
    }

    setSavingMemberVimeoLink(false);
    setEditingMemberVimeoLink(false);
    setMemberVimeoSaveSuccess(true);
    setMemberVimeoPlayerKey((current) => current + 1);
    setItems((previous) =>
      previous.map((item) =>
        item.id === detail.id
          ? {
              ...item,
              hasMemberVimeoLink: true,
            }
          : item,
      ),
    );
  };

  const handleSendResponse = async () => {
    if (!detail) {
      return;
    }

    setSendError("");
    if (!canSendResponse) {
      setSendError("Provide a written response, upload a video, or paste a Vimeo link.");
      return;
    }

    const formData = new FormData();
    formData.set("writtenResponse", writtenResponse.trim());
    if (manualVideoUrl.trim()) {
      formData.set("responseVideoUrl", manualVideoUrl.trim());
    }

    const response = await fetch(`/api/admin/submissions/${tab}/${detail.id}/respond`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setSendError(data.error ?? "Unable to send response.");
      return;
    }

    const summaryParts: string[] = [];
    if (writtenResponse.trim()) {
      summaryParts.push(
        `Written response: "${writtenResponse.trim().slice(0, 180)}${writtenResponse.trim().length > 180 ? "..." : ""}"`,
      );
    }
    if (hasUploadedR2Video) {
      summaryParts.push("Video response sent using uploaded file.");
    } else if (manualVideoUrl.trim()) {
      summaryParts.push(`Video response sent with Vimeo link: ${manualVideoUrl.trim()}`);
    }
    setResponseSummary(summaryParts.join(" "));
    setShowResponseModal(true);

    const refreshed = await fetch(`/api/admin/submissions/${tab}/${detail.id}`);
    if (refreshed.ok) {
      const data = (await refreshed.json()) as { submission: SubmissionDetail };
      setDetail(data.submission);
    } else {
      setDetail({
        ...detail,
        badgeStatus: "RESPONDED",
      });
    }

    setItems((previous) =>
      previous.map((item) =>
        item.id === detail.id
          ? {
              ...item,
              badgeStatus: "RESPONDED",
            }
          : item,
      ),
    );
  };

  const handleUploadResponseVideo = async (file: File | null) => {
    if (!detail || !file) {
      return;
    }

    if (tab !== "swing" && tab !== "mental") {
      return;
    }

    setUploadingResponseR2(true);
    setResponseR2UploadError("");
    setResponseR2UploadSuccess(false);

    const formData = new FormData();
    formData.set("video", file);
    formData.set("submissionId", detail.id);
    formData.set("submissionType", tab);

    try {
      const response = await fetch("/api/admin/upload-response", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        responseVideoUrl?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload response video.");
      }

      setResponseR2UploadSuccess(true);
      setUploadedResponseFileName(file.name);
      setDetail({
        ...detail,
        responseVideoUrl: payload.responseVideoUrl ?? detail.responseVideoUrl ?? null,
      });
    } catch (error) {
      setResponseR2UploadError(
        error instanceof Error ? error.message : "Unable to upload response video.",
      );
    } finally {
      setUploadingResponseR2(false);
    }
  };

  const handleReplaceResponseVideo = async () => {
    if (!detail) {
      return;
    }

    if (tab !== "swing" && tab !== "mental") {
      return;
    }

    setResponseR2UploadError("");
    setResponseR2UploadSuccess(false);
    setUploadedResponseFileName("");
    setResponseVideoInputKey((current) => current + 1);

    if (hasUploadedR2Video) {
      const formData = new FormData();
      formData.set("submissionId", detail.id);
      formData.set("submissionType", tab);

      try {
        const response = await fetch("/api/admin/clear-response-video", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to clear uploaded video.");
        }

        setDetail({
          ...detail,
          responseVideoUrl: null,
        });
      } catch (error) {
        setResponseR2UploadError(
          error instanceof Error ? error.message : "Unable to clear uploaded video.",
        );
      }
    }
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("swing")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm ${
            tab === "swing"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-200 hover:border-[#7f9434]"
          }`}
        >
          Swing Analysis
        </button>
        <button
          type="button"
          onClick={() => setTab("mental")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm ${
            tab === "mental"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-200 hover:border-[#7f9434]"
          }`}
        >
          Mental Game
        </button>
        <button
          type="button"
          onClick={() => setTab("goal")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm ${
            tab === "goal"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-200 hover:border-[#7f9434]"
          }`}
        >
          Goal Check-Ins
        </button>
        <button
          type="button"
          onClick={() => setTab("members")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm ${
            tab === "members"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-200 hover:border-[#7f9434]"
          }`}
        >
          Members
        </button>
        <button
          type="button"
          onClick={() => setTab("playbook")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm ${
            tab === "playbook"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-200 hover:border-[#7f9434]"
          }`}
        >
          Playbook Reflections
        </button>
      </div>

      {tab === "members" ? (
        <MembersPanel />
      ) : tab === "playbook" ? (
        <PlaybookReflectionsPanel />
      ) : tab === "goal" ? (
        <GoalCheckinsPanel />
      ) : (
    <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-[#18243a] bg-black/30 p-3 sm:p-4">
        <div className="mt-4 space-y-3">
          {loadingList && <p className="text-sm text-zinc-400">Loading submissions...</p>}
          {!loadingList && items.length === 0 && (
            <p className="text-sm text-zinc-400">No submissions yet.</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedId === item.id
                  ? "border-[#22c55e]/70 bg-[#22c55e]/10"
                  : "border-[#2b3650] bg-[#0b1324]/80 hover:border-[#7f9434]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-100">{item.playerName}</p>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center"
                    title={item.hasMemberVimeoLink ? "Member Vimeo link saved" : "Member Vimeo link needed"}
                  >
                    {item.hasMemberVimeoLink ? (
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4 text-[#22c55e]"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-500">-</span>
                    )}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.badgeStatus === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-200"
                        : "bg-[#22c55e]/20 text-[#9df3bd]"
                    }`}
                  >
                    {item.badgeStatus === "PENDING" ? "Pending" : "Responded"}
                  </span>
                </div>
              </div>
              {tab === "mental" && item.topic && (
                <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">{item.topic}</p>
              )}
              <p className="mt-2 text-xs text-zinc-400">{item.userEmail}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-[#18243a] bg-black/30 p-4 sm:p-5">
        {!selectedId && <p className="text-zinc-400">Select a submission to view details.</p>}
        {loadingDetail && <p className="text-zinc-400">Loading submission details...</p>}
        {!loadingDetail && detail && (
            <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="break-words text-xl font-semibold leading-tight text-zinc-100 sm:text-2xl">{detail.playerName}</h2>
              <p className="mt-1 text-sm text-zinc-300">Submitted by {detail.userEmail}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {new Date(detail.createdAt).toLocaleString()} -{" "}
                {detail.badgeStatus === "PENDING" ? "Pending" : "Responded"}
              </p>
            </div>

            {detail.memberProfile ? (
              <MemberProfileCard profile={detail.memberProfile} />
            ) : null}

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4 text-sm text-zinc-200">
              {tab === "mental" ? (
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold text-zinc-100">Topic:</span> {detail.topic}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-100">Player age:</span>{" "}
                    {detail.playerAge}
                  </p>
                  <p className="whitespace-pre-wrap">
                    <span className="font-semibold text-zinc-100">Message:</span> {detail.message}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold text-zinc-100">Pitch focus:</span>{" "}
                    {detail.pitchType}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-100">Handedness:</span>{" "}
                    {detail.handedness}
                  </p>
                  <p className="whitespace-pre-wrap">
                    <span className="font-semibold text-zinc-100">Notes:</span> {detail.notes}
                  </p>
                </div>
              )}
              <p className="mt-3">
                <span className="font-semibold text-zinc-100">Preferred response:</span>{" "}
                {detail.responsePreference === "VIDEO_RESPONSE"
                  ? "Video Response from Coach"
                  : "Written Response"}
              </p>
            </div>

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
              <h3 className="text-lg font-semibold text-zinc-100">Member Submission Video</h3>

              {detail.memberVimeoLink && !editingMemberVimeoLink ? (
                <div className="mt-3 space-y-2">
                  {memberVimeoSaveSuccess ? (
                    <p className="text-sm font-medium text-[#9df3bd]">Video link saved</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemberVimeoLink(true);
                      setMemberVimeoLinkInput(detail.memberVimeoLink ?? "");
                      setMemberVimeoSaveError("");
                      setMemberVimeoSaveSuccess(false);
                    }}
                    className="text-sm font-medium text-[#52B788] underline transition hover:text-[#9df3bd]"
                  >
                    Change Video Link
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-zinc-200" htmlFor="member-vimeo-link">
                    Paste Member Vimeo Link
                  </label>
                  <input
                    id="member-vimeo-link"
                    type="url"
                    value={memberVimeoLinkInput}
                    onChange={(event) => setMemberVimeoLinkInput(event.target.value)}
                    placeholder="https://vimeo.com/..."
                    className="w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                  />
                  <p className="text-xs text-zinc-400">
                    Note: make sure the video is set to Unlisted on Vimeo so members can view it without
                    signing in.
                  </p>
                  {memberVimeoSaveError ? (
                    <p className="text-sm text-red-300">{memberVimeoSaveError}</p>
                  ) : null}
                  {memberVimeoSaveSuccess ? (
                    <p className="text-sm font-medium text-[#9df3bd]">Video link saved</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSaveMemberVimeoLink}
                    disabled={savingMemberVimeoLink || !memberVimeoLinkInput.trim()}
                    className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingMemberVimeoLink ? "Saving..." : "Save Link"}
                  </button>
                </div>
              )}

              {memberVimeoEmbedUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-[#2b3650] bg-black">
                  <div className="aspect-video w-full">
                    <iframe
                      key={`${memberVimeoPlayerKey}-${memberVimeoEmbedUrl}`}
                      src={memberVimeoEmbedUrl}
                      title="Member submission video"
                      className="h-full w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : fallbackVideoUrl ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-zinc-400">
                    Temporary link -- upload to Vimeo and paste link above for permanent access
                  </p>
                  <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
                    <div className="border-b border-[#2b3650] px-4 py-2">
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={fallbackVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#8fd7ff] underline"
                        >
                          Open submission video link
                        </a>
                        <a
                          href={`${fallbackVideoUrl}${fallbackVideoUrl.includes("?") ? "&" : "?"}download=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#8fd7ff] underline"
                        >
                          Download video
                        </a>
                      </div>
                    </div>
                    <div className="aspect-video w-full">
                      {canInlineFallbackVideo ? (
                        <video src={fallbackVideoUrl} controls className="h-full w-full" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-400">
                          Use the links above to open or download this submission video.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">No member submission video available.</p>
              )}
            </div>

            {detail.badgeStatus === "RESPONDED" ? (
              <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-zinc-100">Your Response</h3>
                  <span className="rounded-full bg-[#22c55e]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
                    Responded
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  Sent {formatResponseDateTime(detail.respondedAt)}
                </p>

                {detail.responseText ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-200">{detail.responseText}</p>
                ) : null}

                {detail.responseVideoUrl ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-[#2b3650] bg-black">
                    {toVimeoEmbedUrl(detail.responseVideoUrl) ? (
                      <div className="aspect-video w-full">
                        <iframe
                          src={toVimeoEmbedUrl(detail.responseVideoUrl) ?? undefined}
                          title="Coach response video"
                          className="h-full w-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (() => {
                      const inlineResponseUrl =
                        resolveInlineSubmissionVideoUrl(detail.responseVideoUrl ?? "") ??
                        detail.responseVideoUrl;
                      return canInlineResponseVideo(inlineResponseUrl) ? (
                        <div className="aspect-video w-full">
                          <video src={inlineResponseUrl} controls className="h-full w-full" />
                        </div>
                      ) : (
                        <div className="px-4 py-3">
                          <a
                            href={detail.responseVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#8fd7ff] underline"
                          >
                            Open response video
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                ) : null}

                {!detail.responseText && !detail.responseVideoUrl ? (
                  <p className="mt-4 text-sm text-zinc-400">No response content saved for this submission.</p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
                <h3 className="text-lg font-semibold text-zinc-100">Send Response</h3>
                <div className="mt-4 space-y-4">
                  <textarea
                    rows={6}
                    value={writtenResponse}
                    onChange={(event) => setWrittenResponse(event.target.value)}
                    placeholder="Write your response here..."
                    className="w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                  />

                  <div className="space-y-3">
                    <input
                      key={responseVideoInputKey}
                      ref={responseVideoInputRef}
                      type="file"
                      accept="video/*"
                      disabled={uploadingResponseR2}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        void handleUploadResponseVideo(file);
                        event.target.value = "";
                      }}
                      className="hidden"
                    />

                    {hasResponseVideoReady ? (
                      <div className="space-y-3">
                        {detail.responseVideoUrl &&
                        resolveInlineSubmissionVideoUrl(detail.responseVideoUrl) ? (
                          <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
                            <div className="aspect-video w-full">
                              <video
                                src={
                                  resolveInlineSubmissionVideoUrl(detail.responseVideoUrl) ?? undefined
                                }
                                controls
                                className="h-full w-full"
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm text-zinc-300">
                            {responseVideoDisplayName ?? "Response video uploaded"}
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleReplaceResponseVideo()}
                            disabled={uploadingResponseR2}
                            className="rounded-full border border-[#52B788]/40 px-4 py-1.5 text-xs font-semibold text-[#52B788] transition hover:border-[#52B788] hover:text-[#9df3bd] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Replace Video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => responseVideoInputRef.current?.click()}
                        disabled={uploadingResponseR2}
                        className="rounded-full bg-[#52B788] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#9df3bd] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Upload Response Video
                      </button>
                    )}

                    {responseR2UploadError ? (
                      <p className="text-sm text-red-300">{responseR2UploadError}</p>
                    ) : null}
                    {responseR2UploadSuccess ? (
                      <p className="text-sm font-medium text-[#9df3bd]">Response video uploaded.</p>
                    ) : null}
                    {uploadingResponseR2 ? (
                      <p className="text-sm text-zinc-400">Uploading response video...</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {!showVimeoInput ? (
                      <button
                        type="button"
                        onClick={() => setShowVimeoInput(true)}
                        className="text-xs text-zinc-500 transition hover:text-zinc-300"
                      >
                        Or paste a Vimeo link instead
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={manualVideoUrl}
                          onChange={(event) => setManualVideoUrl(event.target.value)}
                          placeholder="https://vimeo.com/..."
                          className="w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                        />
                        <p className="text-xs text-zinc-400">
                          Note: make sure the video is set to Unlisted on Vimeo so members can view it
                          without signing in.
                        </p>
                        {coachVimeoEmbedUrl ? (
                          <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
                            <div className="aspect-video w-full">
                              <iframe
                                src={coachVimeoEmbedUrl}
                                title="Coach response preview"
                                className="h-full w-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {sendError && <p className="text-sm text-red-300">{sendError}</p>}

                  <button
                    type="button"
                    onClick={handleSendResponse}
                    disabled={!canSendResponse}
                    className="w-full rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Send Response
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      {showResponseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#2b3650] bg-[#0b1324] p-5 sm:p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Response Sent</h3>
            <p className="mt-3 text-sm text-zinc-300">
              Coach response was sent successfully and the submission has been marked as Responded.
            </p>
            <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/30 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Summary</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                {responseSummary || "Response sent successfully."}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedId(null);
                  setDetail(null);
                }}
                className="w-full rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
              >
                Return to Inbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </div>
  );
}
