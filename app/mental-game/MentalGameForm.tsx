"use client";

import { useState } from "react";

type ResponsePreference = "VIDEO_RESPONSE" | "WRITTEN_RESPONSE";

export default function MentalGameForm() {
  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState("");
  const [topic, setTopic] = useState("SLUMP");
  const [message, setMessage] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [responsePreference, setResponsePreference] = useState<ResponsePreference>("VIDEO_RESPONSE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!playerName.trim() || !playerAge.trim() || !message.trim()) {
      setSubmitError("Please complete all required fields before submitting.");
      return;
    }

    const formData = new FormData();
    formData.set("playerName", playerName.trim());
    formData.set("playerAge", playerAge.trim());
    formData.set("topic", topic);
    formData.set("message", message.trim());
    formData.set("responsePreference", responsePreference);
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

    setSubmitSuccess("Submission received. You will hear back within 48 hours.");
    setPlayerName("");
    setPlayerAge("");
    setTopic("SLUMP");
    setMessage("");
    setVideo(null);
    setResponsePreference("VIDEO_RESPONSE");
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
          onChange={(event) => setVideo(event.target.files?.[0] ?? null)}
          className="mt-2 w-full rounded-lg border border-dashed border-[#3b4b6a] bg-black px-4 py-4 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-[#22c55e] file:px-3 file:py-2 file:font-semibold file:text-black hover:file:bg-[#35db72]"
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
      {submitSuccess && <p className="text-sm text-[#9df3bd]">{submitSuccess}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[#22c55e] px-6 py-3 font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Mental Game Support"}
      </button>
    </form>
  );
}
