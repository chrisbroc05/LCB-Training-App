"use client";

import { useEffect, useMemo, useState } from "react";

type TabType = "swing" | "mental";

type SubmissionListItem = {
  id: string;
  playerName: string;
  topic?: string | null;
  createdAt: string;
  userEmail: string;
  badgeStatus: "PENDING" | "RESPONDED";
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
};

export default function AdminPanel({
  cloudinaryUploadEnabled,
}: {
  cloudinaryUploadEnabled: boolean;
}) {
  const [tab, setTab] = useState<TabType>("swing");
  const [items, setItems] = useState<SubmissionListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [writtenResponse, setWrittenResponse] = useState("");
  const [responseMode, setResponseMode] = useState<"written" | "video">("written");
  const [videoInputMode, setVideoInputMode] = useState<"upload" | "vimeo">(
    cloudinaryUploadEnabled ? "upload" : "vimeo",
  );
  const [responseVideo, setResponseVideo] = useState<File | null>(null);
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [sendError, setSendError] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseSummary, setResponseSummary] = useState("");

  useEffect(() => {
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
    if (!selectedId) {
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
      setWrittenResponse("");
      setResponseVideo(null);
      setManualVideoUrl("");
      setResponseMode("written");
      setVideoInputMode(cloudinaryUploadEnabled ? "upload" : "vimeo");
      setSendError("");
      setShowResponseModal(false);
      setResponseSummary("");
    };

    void loadDetail();
  }, [selectedId, tab, cloudinaryUploadEnabled]);

  const selectedVideoUrl = useMemo(() => {
    if (!detail) {
      return null;
    }
    return detail.submittedVideo || detail.videoPath || null;
  }, [detail]);

  const canInlineVideo = selectedVideoUrl
    ? selectedVideoUrl.startsWith("/api/submission-videos/") ||
      (selectedVideoUrl.startsWith("http") && !selectedVideoUrl.includes("vimeo.com"))
    : false;

  const handleSendResponse = async () => {
    if (!detail) {
      return;
    }

    setSendError("");
    const formData = new FormData();
    formData.set("responseMode", responseMode);

    if (responseMode === "written") {
      if (!writtenResponse.trim()) {
        setSendError("Please provide a written response.");
        return;
      }
      formData.set("writtenResponse", writtenResponse.trim());
    } else {
      formData.set("videoInputMode", videoInputMode);
      if (videoInputMode === "upload") {
        if (!responseVideo) {
          setSendError("Please upload a response video file.");
          return;
        }
        formData.set("responseVideo", responseVideo);
      } else {
        if (!manualVideoUrl.trim()) {
          setSendError("Please paste a Vimeo response link.");
          return;
        }
        formData.set("responseVideoUrl", manualVideoUrl.trim());
      }
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

    const summary =
      responseMode === "written"
        ? `Written response sent: "${writtenResponse.trim().slice(0, 180)}${writtenResponse.trim().length > 180 ? "..." : ""}"`
        : videoInputMode === "upload"
          ? `Video response sent using uploaded file: ${responseVideo?.name ?? "video file"}.`
          : `Video response sent with Vimeo link: ${manualVideoUrl.trim()}`;
    setResponseSummary(summary);
    setShowResponseModal(true);
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
    setDetail({
      ...detail,
      badgeStatus: "RESPONDED",
    });
  };

  return (
    <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-[#18243a] bg-black/30 p-3 sm:p-4">
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
        </div>

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

            {selectedVideoUrl && (
              <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
                <div className="border-b border-[#2b3650] px-4 py-2">
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={selectedVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#8fd7ff] underline"
                    >
                      Open submission video link
                    </a>
                    <a
                      href={`${selectedVideoUrl}${selectedVideoUrl.includes("?") ? "&" : "?"}download=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#8fd7ff] underline"
                    >
                      Download video
                    </a>
                  </div>
                </div>
                <div className="aspect-video w-full">
                  {canInlineVideo ? (
                    <video src={selectedVideoUrl} controls className="h-full w-full" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-400">
                      Use the links above to open or download this submission video.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
              <h3 className="text-lg font-semibold text-zinc-100">Send Response</h3>
              <p className="mt-1 text-xs text-zinc-400">
                For video responses, choose either device upload (camera roll supported) or a manual
                Vimeo link.
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="radio"
                      checked={responseMode === "written"}
                      onChange={() => setResponseMode("written")}
                      className="h-4 w-4 accent-[#22c55e]"
                    />
                    Written Response
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="radio"
                      checked={responseMode === "video"}
                      onChange={() => setResponseMode("video")}
                      className="h-4 w-4 accent-[#22c55e]"
                    />
                    Video Response
                  </label>
                </div>

                {responseMode === "written" ? (
                  <textarea
                    rows={6}
                    value={writtenResponse}
                    onChange={(event) => setWrittenResponse(event.target.value)}
                    placeholder="Write your response here..."
                    className="w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setVideoInputMode("upload")}
                        disabled={!cloudinaryUploadEnabled}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          videoInputMode === "upload"
                            ? "bg-[#22c55e] text-black"
                            : "border border-[#2b3650] text-zinc-200 hover:border-[#7f9434]"
                        } ${!cloudinaryUploadEnabled ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        Upload from Device
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoInputMode("vimeo")}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          videoInputMode === "vimeo"
                            ? "bg-[#22c55e] text-black"
                            : "border border-[#2b3650] text-zinc-200 hover:border-[#7f9434]"
                        }`}
                      >
                        Paste Vimeo Link
                      </button>
                    </div>

                    {!cloudinaryUploadEnabled && (
                      <p className="text-xs text-yellow-200">
                        Device upload is currently disabled. Use a Vimeo link for now.
                      </p>
                    )}

                    {videoInputMode === "upload" && cloudinaryUploadEnabled ? (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(event) => setResponseVideo(event.target.files?.[0] ?? null)}
                          className="w-full rounded-lg border border-dashed border-[#3b4b6a] bg-black px-4 py-4 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#22c55e] file:px-3 file:py-2 file:font-semibold file:text-black hover:file:bg-[#35db72]"
                        />
                        <p className="text-xs text-zinc-400">
                          Upload from desktop or phone camera roll. Files under 10MB are attached
                          to the member email. Larger files are stored on Cloudinary and sent as a
                          download link.
                        </p>
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={manualVideoUrl}
                        onChange={(event) => setManualVideoUrl(event.target.value)}
                        placeholder="https://vimeo.com/..."
                        className="w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                      />
                    )}
                  </div>
                )}

                {sendError && <p className="text-sm text-red-300">{sendError}</p>}

                <button
                  type="button"
                  onClick={handleSendResponse}
                  className="w-full rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
                >
                  Send Response
                </button>
              </div>
            </div>
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
  );
}
