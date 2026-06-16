"use client";

import Link from "next/link";
import { useState } from "react";

const SUBMISSION_TIMEOUT_MS = 90000;

export default function SwingAnalysisForm() {
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
  const [submitError, setSubmitError] = useState("");
  const [submittedNotes, setSubmittedNotes] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!playerName.trim()) {
      setSubmitError("Please provide the player name.");
      return;
    }

    if (!videoFileName && !videoUrl.trim()) {
      setSubmitError("Please upload a video file or provide a video URL.");
      return;
    }

    setIsSubmitting(true);
    const trimmedNotes = notes.trim();
    console.log("[SwingAnalysisForm] Starting submission");

    const formData = new FormData();
    formData.set("playerName", playerName.trim());
    formData.set("videoFileName", videoFileName);
    formData.set("videoUrl", videoUrl.trim());
    formData.set("pitchType", pitchType);
    formData.set("handedness", handedness);
    formData.set("notes", trimmedNotes);
    formData.set("responsePreference", responsePreference);
    if (videoFile) {
      formData.set("video", videoFile);
      console.log(
        `[SwingAnalysisForm] Attached uploaded file: ${videoFile.name} (${videoFile.size} bytes)`,
      );
    } else {
      console.log("[SwingAnalysisForm] No local file uploaded, using URL");
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      abortController.abort();
    }, SUBMISSION_TIMEOUT_MS);

    try {
      const response = await fetch("/api/swing-analysis/submit", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        console.error("[SwingAnalysisForm] Submission failed", response.status, data);
        setSubmitError(
          data.error ??
            "Unable to submit swing analysis. Please try again, or use a smaller video file.",
        );
        return;
      }

      console.log("[SwingAnalysisForm] Submission completed successfully");
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
    } catch (error) {
      window.clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error("[SwingAnalysisForm] Submission timed out");
        setSubmitError(
          "Submission timed out while uploading. Please try a smaller video or submit via video URL.",
        );
        return;
      }

      console.error("[SwingAnalysisForm] Unexpected submission error", error);
      setSubmitError("Submission failed unexpectedly. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
            setVideoFile(file);
            setVideoFileName(file?.name ?? "");
          }}
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-300">Or paste a video URL</span>
        <input
          type="url"
          placeholder="https://vimeo.com/..."
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
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

      {submitError && <p className="text-sm text-red-300">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[#22c55e] px-6 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Swing Analysis"}
      </button>

      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-[92vw] max-w-2xl rounded-2xl border border-[#2b3650] bg-[#0b1324] p-6 shadow-2xl md:p-8">
            <h2 className="text-2xl font-semibold text-zinc-100">Submission Received</h2>
            <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/40 p-4">
              <p className="text-sm font-semibold text-zinc-200">Swing Analysis Summary</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                {submittedNotes || "No notes provided."}
              </p>
            </div>
            <p className="mt-4 text-sm text-[#9df3bd]">You will hear back within 48 hours.</p>
            <div className="mt-6 flex justify-end">
              <Link
                href="/dashboard"
                className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
