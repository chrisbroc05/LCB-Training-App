"use client";

import { useRef, useState } from "react";
import {
  COACH_VIDEO_DRILL_CATEGORY_OPTIONS,
  COACH_VIDEO_NOTE_MAX_LENGTH,
  COACH_VIDEO_TITLE_MAX_LENGTH,
} from "@/lib/coach-video-shared";
import {
  ADMIN_RESPONSE_VIDEO_TOO_LARGE_MESSAGE,
  MAX_ADMIN_RESPONSE_VIDEO_BYTES,
  SUBMISSION_VIDEO_UPLOAD_FAILED_MESSAGE,
} from "@/lib/submission-video-limits";
import {
  uploadVideoToPresignedUrlWithAbort,
  type PresignedSwingUploadResponse,
} from "@/lib/swing-submission-upload-client";

type SendCoachVideoPanelProps = {
  userId: string;
  enrollmentId?: string | null;
  playerLabel: string;
  onClose: () => void;
  onSent?: () => void;
};

export default function SendCoachVideoPanel({
  userId,
  enrollmentId,
  playerLabel,
  onClose,
  onSent,
}: SendCoachVideoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortUploadRef = useRef<(() => void) | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [drillCategory, setDrillCategory] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPreparing, setUploadPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetUploadState = () => {
    abortUploadRef.current = null;
    setUploadPreparing(false);
    setUploadProgress(null);
    setSending(false);
  };

  const handleCancelUpload = () => {
    abortUploadRef.current?.();
    resetUploadState();
    setError("Upload canceled.");
  };

  const handleSend = async () => {
    if (!file) {
      setError("Choose a video from your camera roll.");
      return;
    }

    if (file.size > MAX_ADMIN_RESPONSE_VIDEO_BYTES) {
      setError(ADMIN_RESPONSE_VIDEO_TOO_LARGE_MESSAGE);
      return;
    }

    setError("");
    setSuccess("");
    setSending(true);
    setUploadPreparing(true);
    setUploadProgress(null);

    try {
      const uploadUrlResponse = await fetch("/api/admin/coach-videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          filename: file.name,
          contentType: file.type || "video/mp4",
          fileSize: file.size,
        }),
      });

      const uploadUrlPayload = (await uploadUrlResponse.json().catch(() => ({}))) as {
        error?: string;
      } & PresignedSwingUploadResponse;

      if (!uploadUrlResponse.ok) {
        throw new Error(uploadUrlPayload.error ?? "Unable to prepare video upload.");
      }

      setUploadPreparing(false);
      setUploadProgress(0);

      const upload = uploadVideoToPresignedUrlWithAbort(
        file,
        uploadUrlPayload.uploadUrl,
        uploadUrlPayload.contentType,
        setUploadProgress,
      );
      abortUploadRef.current = upload.abort;
      await upload.promise;
      abortUploadRef.current = null;

      const createResponse = await fetch("/api/admin/coach-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          enrollmentId: enrollmentId ?? null,
          title,
          note,
          drillCategory: drillCategory || null,
          videoKey: uploadUrlPayload.r2Key,
          videoContentType: uploadUrlPayload.contentType,
          videoSizeBytes: file.size,
        }),
      });

      const createPayload = (await createResponse.json().catch(() => ({}))) as { error?: string };

      if (!createResponse.ok) {
        throw new Error(createPayload.error ?? "Unable to send video.");
      }

      setSuccess(`Video sent to ${playerLabel}.`);
      resetUploadState();
      setFile(null);
      setTitle("");
      setNote("");
      setDrillCategory("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSent?.();
    } catch (sendError) {
      resetUploadState();
      setError(
        sendError instanceof Error ? sendError.message : SUBMISSION_VIDEO_UPLOAD_FAILED_MESSAGE,
      );
    }
  };

  const isUploading = uploadPreparing || uploadProgress !== null;

  return (
    <section className="rounded-2xl border border-[#52B788]/40 bg-[#0b1324]/90 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Send video</h2>
          <p className="mt-1 text-sm text-zinc-400">To {playerLabel}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-zinc-400">
          Close
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <label className="block text-sm text-zinc-300">
          Video
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            disabled={isUploading || sending}
            onChange={(event) => {
              setError("");
              setSuccess("");
              setFile(event.target.files?.[0] ?? null);
            }}
            className="mt-1 block w-full text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-[#22c55e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Title
          <input
            type="text"
            value={title}
            maxLength={COACH_VIDEO_TITLE_MAX_LENGTH}
            disabled={isUploading || sending}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
            placeholder="What is this video about?"
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Note (optional)
          <textarea
            rows={3}
            value={note}
            maxLength={COACH_VIDEO_NOTE_MAX_LENGTH}
            disabled={isUploading || sending}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Category (optional)
          <select
            value={drillCategory}
            disabled={isUploading || sending}
            onChange={(event) => setDrillCategory(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
          >
            <option value="">None</option>
            {COACH_VIDEO_DRILL_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {uploadPreparing ? (
          <p className="text-sm text-zinc-400">Preparing upload...</p>
        ) : null}

        {uploadProgress !== null ? (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-[#2b3650]">
              <div
                className="h-full bg-[#52B788] transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-zinc-400">Uploading {uploadProgress}%</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={sending || isUploading || !file || !title.trim()}
            onClick={() => void handleSend()}
            className="rounded-full bg-[#22c55e] px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send video"}
          </button>
          {isUploading ? (
            <button
              type="button"
              onClick={handleCancelUpload}
              className="rounded-full border border-[#2b3650] px-5 py-2 text-sm font-semibold text-zinc-300"
            >
              Cancel upload
            </button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-[#52B788]">{success}</p> : null}
      </div>
    </section>
  );
}
