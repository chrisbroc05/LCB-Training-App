"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DRILL_LIBRARY_CATEGORY_FILTERS,
  type DrillLibraryCategoryFilterKey,
} from "@/lib/drill-library-filter-shared";

export type AdminDrillPickerOption = {
  id: string;
  title: string;
  category: "hitting" | "fielding" | "mindset";
  categoryLabel: string;
  url: string;
  thumbnailUrl: string | null;
};

type AdminDrillPickerProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelectable?: number;
  title?: string;
  description?: string;
  disabled?: boolean;
};

function DrillThumbnail({ thumbnailUrl }: { thumbnailUrl: string | null }) {
  const [hasImageError, setHasImageError] = useState(false);
  const showThumbnail = Boolean(thumbnailUrl) && !hasImageError;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#2b3650] bg-black">
      {showThumbnail ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl ?? ""}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
          <div className="absolute inset-0 bg-black/35" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f1d34_0%,#152238_55%,#0b1324_100%)]" />
      )}
    </div>
  );
}

export default function AdminDrillPicker({
  selectedIds,
  onChange,
  maxSelectable = 5,
  title = "Drills",
  description = "Search and filter the drill library, then select drills below.",
  disabled = false,
}: AdminDrillPickerProps) {
  const [videos, setVideos] = useState<AdminDrillPickerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DrillLibraryCategoryFilterKey>("all");

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      setLoadError("");

      const response = await fetch("/api/admin/drill-library");
      if (!response.ok) {
        setLoadError("Unable to load drill library.");
        setVideos([]);
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { videos: AdminDrillPickerOption[] };
      setVideos(data.videos.filter((video) => Boolean(video.id)));
      setLoading(false);
    };

    void loadVideos();
  }, []);

  const videoById = useMemo(() => new Map(videos.map((video) => [video.id, video])), [videos]);

  const selectedVideos = useMemo(
    () =>
      selectedIds
        .map((id) => videoById.get(id))
        .filter((video): video is AdminDrillPickerOption => Boolean(video)),
    [selectedIds, videoById],
  );

  const filteredVideos = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return videos.filter((video) => {
      if (categoryFilter !== "all" && video.category !== categoryFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return video.title.toLowerCase().includes(normalizedQuery);
    });
  }, [videos, searchQuery, categoryFilter]);

  const toggleVideo = (videoId: string) => {
    if (disabled) {
      return;
    }

    if (selectedIds.includes(videoId)) {
      onChange(selectedIds.filter((id) => id !== videoId));
      return;
    }

    if (selectedIds.length >= maxSelectable) {
      return;
    }

    onChange([...selectedIds, videoId]);
  };

  const removeSelected = (videoId: string) => {
    if (disabled) {
      return;
    }
    onChange(selectedIds.filter((id) => id !== videoId));
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#2b3650] bg-black/20 p-4">
      <div>
        <h4 className="text-base font-semibold text-zinc-100">{title}</h4>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
        <p className="mt-2 text-xs text-zinc-500">
          {selectedIds.length} of {maxSelectable} selected
        </p>
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedVideos.map((video) => (
            <button
              key={video.id}
              type="button"
              disabled={disabled}
              onClick={() => removeSelected(video.id)}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#52B788]/50 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold text-[#9df3bd] disabled:opacity-50"
            >
              <span className="truncate">{video.title}</span>
              <span aria-hidden="true" className="text-[#52B788]">
                x
              </span>
            </button>
          ))}
          {selectedIds.length > selectedVideos.length ? (
            <span className="self-center text-xs text-zinc-500">
              {selectedIds.length - selectedVideos.length} selected drill
              {selectedIds.length - selectedVideos.length === 1 ? "" : "s"} not in list
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by drill title..."
          disabled={disabled || loading}
          className="w-full rounded-lg border border-[#2b3650] bg-black px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="flex flex-wrap gap-2">
          {DRILL_LIBRARY_CATEGORY_FILTERS.map((category) => (
            <button
              key={category.key}
              type="button"
              disabled={disabled || loading}
              onClick={() => setCategoryFilter(category.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                categoryFilter === category.key
                  ? "bg-[#22c55e] text-black"
                  : "border border-[#2b3650] text-zinc-300 hover:border-[#3c4a68]"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading drill library...</p>
      ) : loadError ? (
        <p className="text-sm text-red-300">{loadError}</p>
      ) : filteredVideos.length === 0 ? (
        <p className="text-sm text-zinc-400">No drills match your search.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredVideos.map((video) => {
              const isSelected = selectedIds.includes(video.id);
              const isDisabled =
                disabled || (!isSelected && selectedIds.length >= maxSelectable);

              return (
                <button
                  key={video.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleVideo(video.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-[#22c55e] bg-[#22c55e]/10 ring-1 ring-[#22c55e]/40"
                      : "border-[#2b3650] bg-[#0b1324]/70 hover:border-[#3c4a68]"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <DrillThumbnail thumbnailUrl={video.thumbnailUrl} />
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{video.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                        {video.categoryLabel}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="rounded-full bg-[#22c55e] px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                        Selected
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
