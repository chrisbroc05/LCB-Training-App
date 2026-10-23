"use client";

import { useCallback, useEffect, useState } from "react";

type DrillCatalogRow = {
  id: string | null;
  title: string;
  categoryLabel: string;
  isStarterDrill: boolean;
};

export default function AdminDrillLibraryPanel() {
  const [videos, setVideos] = useState<DrillCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/drill-library");
      const data = (await response.json()) as { videos?: DrillCatalogRow[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load drills.");
      }
      setVideos(data.videos ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load drills.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  const toggleStarter = async (vimeoId: string, isStarterDrill: boolean) => {
    setSavingId(vimeoId);
    setError("");
    try {
      const response = await fetch("/api/admin/drill-library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vimeoId, isStarterDrill }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save.");
      }
      setVideos((current) =>
        current.map((video) =>
          video.id === vimeoId ? { ...video, isStarterDrill } : video,
        ),
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save.");
    } finally {
      setSavingId(null);
    }
  };

  const starterCount = videos.filter((video) => video.isStarterDrill).length;

  return (
    <div>
      <p className="text-sm text-zinc-400">
        Toggle which drills new Playbook buyers can watch. Target about 15-20 starters.{" "}
        {starterCount} selected.
      </p>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-zinc-400">Loading...</p> : null}

      <ul className="mt-6 space-y-2">
        {videos.map((video) =>
          video.id ? (
            <li
              key={video.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2b3650] bg-[#0b1324]/80 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-100">{video.title}</p>
                <p className="text-xs text-zinc-500">{video.categoryLabel}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={video.isStarterDrill}
                  disabled={savingId === video.id}
                  onChange={(event) => void toggleStarter(video.id!, event.target.checked)}
                  className="rounded border-[#2b3650]"
                />
                Starter
              </label>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}
