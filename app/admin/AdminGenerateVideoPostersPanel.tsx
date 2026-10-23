"use client";

import { useState } from "react";
import { appendVideoPreviewTimeFragment } from "@/lib/video-playback-shared";
import { uploadVideoPosterForR2Key } from "@/lib/video-poster-capture-client";
type VideoPosterBackfillItem = {
  targetType:
    | "swing_submitted"
    | "swing_response"
    | "mental_submitted"
    | "mental_response"
    | "coach_video";
  id: string;
  videoR2Key: string;
  label: string;
};

const BATCH_SIZE = 3;

export default function AdminGenerateVideoPostersPanel() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  const appendLog = (line: string) => {
    setLog((current) => [...current.slice(-40), line]);
  };

  const processItem = async (item: VideoPosterBackfillItem) => {
    const playbackResponse = await fetch("/api/video-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r2Key: item.videoR2Key }),
    });
    if (!playbackResponse.ok) {
      throw new Error("Unable to load video for poster capture.");
    }
    const playback = (await playbackResponse.json()) as { playbackUrl?: string };
    if (!playback.playbackUrl) {
      throw new Error("Missing playback URL.");
    }

    const posterR2Key = await uploadVideoPosterForR2Key({
      videoR2Key: item.videoR2Key,
      source: appendVideoPreviewTimeFragment(playback.playbackUrl, 1),
      uploadUrlPath: "/api/admin/video-poster/upload-url",
    });

    if (!posterR2Key) {
      throw new Error("Poster capture failed.");
    }

    const applyResponse = await fetch("/api/admin/video-posters/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: item.targetType,
        id: item.id,
        videoR2Key: item.videoR2Key,
        posterR2Key,
      }),
    });

    if (!applyResponse.ok) {
      const payload = (await applyResponse.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Unable to save poster.");
    }
  };

  const runBatch = async () => {
    setRunning(true);
    setLog([]);
    setProcessedCount(0);

    try {
      const backlogResponse = await fetch("/api/admin/video-posters/backlog");
      const backlogPayload = (await backlogResponse.json()) as { items?: VideoPosterBackfillItem[] };
      const items = backlogPayload.items ?? [];
      if (items.length === 0) {
        appendLog("No videos missing posters.");
        return;
      }

      appendLog(`Found ${items.length} videos in this batch.`);

      for (const item of items.slice(0, BATCH_SIZE)) {
        try {
          appendLog(`Processing: ${item.label}`);
          await processItem(item);
          setProcessedCount((count) => count + 1);
          appendLog(`Saved poster for ${item.label}.`);
        } catch (error) {
          appendLog(
            `Skipped ${item.label}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      appendLog("Batch finished. Run again if more videos remain.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Video poster backfill</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Generates JPEG poster frames for existing R2 videos in small browser batches. Run this on the
        live admin site only.
      </p>
      <button
        type="button"
        disabled={running}
        onClick={() => void runBatch()}
        className="mt-4 rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
      >
        {running ? "Working..." : "Generate thumbnails for existing videos"}
      </button>
      {processedCount > 0 ? (
        <p className="mt-3 text-sm text-zinc-300">Saved {processedCount} poster(s) this run.</p>
      ) : null}
      {log.length > 0 ? (
        <pre className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-[#2b3650] bg-black/40 p-3 text-xs text-zinc-400">
          {log.join("\n")}
        </pre>
      ) : null}
    </div>
  );
}
