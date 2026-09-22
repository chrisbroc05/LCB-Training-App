"use client";

import { useEffect, useMemo, useState } from "react";

type DrillLibraryOption = {
  id: string;
  title: string;
  category: "hitting" | "fielding" | "mindset";
  categoryLabel: string;
  url: string;
  thumbnailUrl: string | null;
};

type DrillCategoryFilter = "all" | DrillLibraryOption["category"];

const categoryFilters: { key: DrillCategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "hitting", label: "Hitting" },
  { key: "fielding", label: "Fielding" },
  { key: "mindset", label: "Mindset" },
];

const MAX_SELECTED = 5;

type RecommendDrillsPickerProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
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

export default function RecommendDrillsPicker({
  selectedIds,
  onChange,
  disabled = false,
}: RecommendDrillsPickerProps) {
  const [videos, setVideos] = useState<DrillLibraryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DrillCategoryFilter>("all");

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

      const data = (await response.json()) as { videos: DrillLibraryOption[] };
      setVideos(data.videos.filter((video) => Boolean(video.id)));
      setLoading(false);
    };

    void loadVideos();
  }, []);

  const filteredVideos = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return videos.filter((video) => {
      if (categoryFilter !== "all" && video.category !== categoryFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        video.title.toLowerCase().includes(normalizedQuery) ||
        video.categoryLabel.toLowerCase().includes(normalizedQuery)
      );
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

    if (selectedIds.length >= MAX_SELECTED) {
      return;
    }

    onChange([...selectedIds, videoId]);
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#2b3650] bg-black/20 p-4">
      <div>
        <h4 className="text-base font-semibold text-zinc-100">Recommend Drills</h4>
        <p className="mt-1 text-sm text-zinc-400">
          Select up to 5 drills for this player to work on.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {selectedIds.length} of {MAX_SELECTED} selected
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search drills..."
          disabled={disabled || loading}
          className="w-full rounded-lg border border-[#2b3650] bg-black px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e] disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((category) => (
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
                disabled || (!isSelected && selectedIds.length >= MAX_SELECTED);

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
