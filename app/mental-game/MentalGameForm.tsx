"use client";

import Link from "next/link";
import { useState } from "react";

type ResponsePreference = "VIDEO_RESPONSE" | "WRITTEN_RESPONSE";
const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;

export default function MentalGameForm() {
  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState("");
  const [topic, setTopic] = useState("SLUMP");
  const [message, setMessage] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [responsePreference, setResponsePreference] = useState<ResponsePreference>("VIDEO_RESPONSE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedTopic, setSubmittedTopic] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!playerName.trim() || !playerAge.trim() || !message.trim()) {
      setSubmitError("Please complete all required fields before submitting.");
      return;
    }
    if (video && video.size > MAX_VIDEO_UPLOAD_BYTES) {
      setSubmitError("Video exceeds 100MB. Please trim the video and try again.");
      return;
    }

    const trimmedMessage = message.trim();
    const formData = new FormData();
    formData.set("playerName", playerName.trim());
    formData.set("playerAge", playerAge.trim());
    formData.set("topic", topic);
    formData.set("message", trimmedMessage);
    formData.set("responsePreference", responsePreference);
    formData.set("videoUrl", manualVideoUrl.trim());
    if (video) {
      formData.set("video", video);
    }

    setIsSubmitting(true);
    const response = await fetch("/api/mental-game/submit", {
      method: "POST",
      body: formData,
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setSubmitError(data.error ?? "Unable to submit mental game support request.");
      return;
    }

    setSubmittedTopic(topic);
    setSubmittedMessage(trimmedMessage);
    setShowConfirmationModal(true);
    setPlayerName("");
    setPlayerAge("");
    setTopic("SLUMP");
    setMessage("");
    setVideo(null);
    setManualVideoUrl("");
    setResponsePreference("VIDEO_RESPONSE");
  };

  return (
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
        <span className="text-sm text-zinc-300">Age of player</span>
        <input
          type="text"
          value={playerAge}
          onChange={(event) => setPlayerAge(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-300">Topic</span>
        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 focus:border-[#22c55e]"
        >
          <option value="SLUMP">Slump</option>
          <option value="CONFIDENCE">Confidence</option>
          <option value="NERVES">Nerves</option>
          <option value="FEAR_OF_FAILURE">Fear of Failure</option>
          <option value="PRESSURE_SITUATIONS">Pressure Situations</option>
          <option value="LOSING_MOTIVATION">Losing Motivation</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm text-zinc-300">Describe in detail what is going on</span>
        <textarea
          rows={7}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-300">Optional video upload</span>
        <input
          type="file"
          accept="video/*"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            if (selected && selected.size > MAX_VIDEO_UPLOAD_BYTES) {
              setSubmitError("Video exceeds 100MB. Please trim the video and try again.");
              setVideo(null);
              return;
            }

            setSubmitError("");
            setVideo(selected);
          }}
          className="mt-2 w-full rounded-lg border border-dashed border-[#3b4b6a] bg-black px-4 py-4 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#22c55e] file:px-3 file:py-2 file:font-semibold file:text-black hover:file:bg-[#35db72]"
        />
        <p className="mt-2 text-xs text-zinc-400">
          Max file size is 100MB. Please trim the video if it exceeds that limit.
        </p>
      </label>

      <label className="block">
        <span className="text-sm text-zinc-300">Optional external video URL</span>
        <input
          type="url"
          placeholder="https://..."
          value={manualVideoUrl}
          onChange={(event) => setManualVideoUrl(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
        />
      </label>

      <fieldset>
        <legend className="text-sm text-zinc-300">How would you like to receive your response?</legend>
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
        className="w-full rounded-full bg-[#22c55e] px-6 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? "Submitting..." : "Submit Coaching Submission"}
      </button>

      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-[94vw] max-w-2xl rounded-2xl border border-[#2b3650] bg-[#0b1324] p-5 shadow-2xl sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Submission Received</h2>
            <div className="mt-4 rounded-xl border border-[#2b3650] bg-black/40 p-4">
              <p className="text-sm font-semibold text-zinc-200">Coaching Submission Summary</p>
              <p className="mt-2 text-sm text-zinc-300">
                <span className="font-semibold text-zinc-100">Topic:</span> {submittedTopic}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{submittedMessage}</p>
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
