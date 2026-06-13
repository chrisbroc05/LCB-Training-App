"use client";

import { useState } from "react";

export default function SwingAnalysisForm() {
  const [videoFileName, setVideoFileName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pitchType, setPitchType] = useState("Fastball timing");
  const [handedness, setHandedness] = useState("Right-handed hitter");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!videoFileName && !videoUrl.trim()) {
      setSubmitError("Please upload a video file or provide a video URL.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/swing-analysis/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoFileName,
        videoUrl: videoUrl.trim(),
        pitchType,
        handedness,
        notes: notes.trim(),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setSubmitError(data.error ?? "Unable to submit swing analysis.");
      return;
    }

    setSubmitSuccess("Submission received. Coach notification sent.");
    setVideoFileName("");
    setVideoUrl("");
    setPitchType("Fastball timing");
    setHandedness("Right-handed hitter");
    setNotes("");
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm text-zinc-300">Upload video</span>
        <input
          type="file"
          accept="video/*"
          className="mt-2 w-full rounded-lg border border-dashed border-[#3b4b6a] bg-black px-4 py-4 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#22c55e] file:px-3 file:py-2 file:font-semibold file:text-black hover:file:bg-[#35db72]"
          onChange={(event) => setVideoFileName(event.target.files?.[0]?.name ?? "")}
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

      {submitError && <p className="text-sm text-red-300">{submitError}</p>}
      {submitSuccess && <p className="text-sm text-[#9df3bd]">{submitSuccess}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[#22c55e] px-6 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Swing Analysis"}
      </button>
    </form>
  );
}
