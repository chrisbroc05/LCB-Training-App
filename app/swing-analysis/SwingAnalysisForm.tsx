"use client";

import CoachingSubmissionConfirmation from "@/app/components/CoachingSubmissionConfirmation";
import ResponsiveOverlay from "@/app/components/mobile/ResponsiveOverlay";
import {
  MAX_SUBMISSION_VIDEO_BYTES,
  SUBMISSION_VIDEO_MAX_SIZE_LABEL,
  SUBMISSION_VIDEO_TOO_LARGE_MESSAGE,
  SUBMISSION_VIDEO_UPLOAD_FAILED_MESSAGE,
} from "@/lib/submission-video-limits";
import {
  uploadVideoToPresignedUrl,
  type PresignedSwingUploadResponse,
} from "@/lib/swing-submission-upload-client";
import { useState } from "react";

type SwingAnalysisFormProps = {
  isFreeMember?: boolean;
};

export default function SwingAnalysisForm({ isFreeMember = false }: SwingAnalysisFormProps) {
  const [playerName, setPlayerName] = useState("");
  const [videoFileName, setVideoFileName] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [pitchType, setPitchType] = useState("Fastball timing");
  const [handedness, setHandedness] = useState("Right-handed hitter");
  const [notes, setNotes] = useState("");
  const [responsePreference, setResponsePreference] = useState<"VIDEO_RESPONSE" | "WRITTEN_RESPONSE">(
    "VIDEO_RESPONSE",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submittedNotes, setSubmittedNotes] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const submitButtonLabel = (() => {
    if (!isSubmitting) {
      return "Submit Coaching Submission";
    }

    if (uploadProgress !== null && uploadProgress < 100) {
      return `Uploading video... ${uploadProgress}%`;
    }

    return "Submitting...";
  })();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setUploadProgress(null);

    if (!playerName.trim()) {
      setSubmitError("Please provide the player name.");
      return;
    }

    if (!videoFileName && !videoUrl.trim()) {
      setSubmitError("Please upload a video file or provide a video URL.");
      return;
    }

    if (videoFile && videoFile.size > MAX_SUBMISSION_VIDEO_BYTES) {
      setSubmitError(SUBMISSION_VIDEO_TOO_LARGE_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    const trimmedNotes = notes.trim();

    try {
      let r2Key: string | undefined;

      if (videoFile) {
        setUploadProgress(0);

        const uploadUrlResponse = await fetch("/api/swing-analysis/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: videoFile.name,
            contentType: videoFile.type || "video/mp4",
            fileSize: videoFile.size,
          }),
        });

        if (!uploadUrlResponse.ok) {
          const data = (await uploadUrlResponse.json().catch(() => ({}))) as { error?: string };
          setSubmitError(data.error ?? SUBMISSION_VIDEO_UPLOAD_FAILED_MESSAGE);
          return;
        }

        const presignedUpload = (await uploadUrlResponse.json()) as PresignedSwingUploadResponse;

        try {
          await uploadVideoToPresignedUrl(
            videoFile,
            presignedUpload.uploadUrl,
            presignedUpload.contentType,
            setUploadProgress,
          );
        } catch {
          setSubmitError(SUBMISSION_VIDEO_UPLOAD_FAILED_MESSAGE);
          return;
        }

        r2Key = presignedUpload.r2Key;
      }

      const response = await fetch("/api/swing-analysis/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim(),
          pitchType,
          handedness,
          notes: trimmedNotes,
          responsePreference,
          videoUrl: videoUrl.trim() || undefined,
          r2Key,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setSubmitError(
          data.error ?? "Unable to submit swing analysis. Please try again.",
        );
        return;
      }

      setSubmittedNotes(trimmedNotes);
      setShowConfirmationModal(true);
      setPlayerName("");
      setVideoFileName("");
      setVideoFile(null);
      setVideoUrl("");
      setPitchType("Fastball timing");
      setHandedness("Right-handed hitter");
      setNotes("");
      setResponsePreference("VIDEO_RESPONSE");
    } catch {
      setSubmitError(SUBMISSION_VIDEO_UPLOAD_FAILED_MESSAGE);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <>
      <form className="mt-6 space-y-5 sm:mt-8" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm text-zinc-300">Player name</span>
          <input
            type="text"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-300">Upload video</span>
          <input
            type="file"
            accept="video/*"
            className="mt-2 w-full rounded-lg border border-dashed border-[#3b4b6a] bg-black px-4 py-4 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#22c55e] file:px-3 file:py-2 file:font-semibold file:text-black hover:file:bg-[#35db72]"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (file && file.size > MAX_SUBMISSION_VIDEO_BYTES) {
                setSubmitError(SUBMISSION_VIDEO_TOO_LARGE_MESSAGE);
                setVideoFile(null);
                setVideoFileName("");
                return;
              }

              setSubmitError("");
              setVideoFile(file);
              setVideoFileName(file?.name ?? "");
            }}
          />
          <p className="mt-2 text-xs text-zinc-400">
            Max file size is {SUBMISSION_VIDEO_MAX_SIZE_LABEL}. Please trim or compress larger videos before uploading.
          </p>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-300">Or paste a video URL</span>
          <input
            type="url"
            placeholder="https://..."
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-zinc-300">Pitch Type Focus</span>
            <select
              value={pitchType}
              onChange={(event) => setPitchType(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
            >
              <option>Fastball timing</option>
              <option>Offspeed recognition</option>
              <option>Inside pitch mechanics</option>
              <option>Outside pitch approach</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-zinc-300">Handedness</span>
            <select
              value={handedness}
              onChange={(event) => setHandedness(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
            >
              <option>Right-handed hitter</option>
              <option>Left-handed hitter</option>
              <option>Switch hitter</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-zinc-300">Notes for coach</span>
          <textarea
            rows={5}
            placeholder="Include what you are currently working on and where you feel inconsistent."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
          />
        </label>

        <fieldset>
          <legend className="text-sm text-zinc-300">Preferred response type</legend>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-3 text-zinc-100">
              <input
                type="radio"
                name="responsePreference"
                value="VIDEO_RESPONSE"
                checked={responsePreference === "VIDEO_RESPONSE"}
                onChange={() => setResponsePreference("VIDEO_RESPONSE")}
                className="h-4 w-4 accent-[#22c55e]"
              />
              <span>Video Response from Coach</span>
            </label>
            <label className="flex items-center gap-3 text-zinc-100">
              <input
                type="radio"
                name="responsePreference"
                value="WRITTEN_RESPONSE"
                checked={responsePreference === "WRITTEN_RESPONSE"}
                onChange={() => setResponsePreference("WRITTEN_RESPONSE")}
                className="h-4 w-4 accent-[#22c55e]"
              />
              <span>Written Response</span>
            </label>
          </div>
        </fieldset>

        {uploadProgress !== null && isSubmitting ? (
          <div className="rounded-lg border border-[#2b3650] bg-black/40 p-4">
            <div className="flex items-center justify-between text-sm text-zinc-300">
              <span>Uploading video</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a253a]">
              <div
                className="h-full rounded-full bg-[#22c55e] transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {submitError && <p className="text-sm text-red-300">{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-[#22c55e] px-6 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitButtonLabel}
        </button>
      </form>

      {showConfirmationModal ? (
        <ResponsiveOverlay
          open={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          ariaLabel="Submission confirmation"
          desktopClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          desktopPanelClassName="w-[94vw] max-w-2xl overflow-y-auto rounded-2xl border border-[#18243a] bg-[#0b1324] p-0 shadow-2xl sm:max-w-3xl"
        >
          <CoachingSubmissionConfirmation
            isFreeMember={isFreeMember}
            summary={
              <div className="rounded-xl border border-[#2b3650] bg-black/40 p-4">
                <p className="text-sm font-semibold text-zinc-200">Coaching Submission Summary</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                  {submittedNotes || "No notes provided."}
                </p>
              </div>
            }
            onClose={() => setShowConfirmationModal(false)}
          />
        </ResponsiveOverlay>
      ) : null}
    </>
  );
}
