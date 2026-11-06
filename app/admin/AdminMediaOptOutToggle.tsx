"use client";

import { useState } from "react";
import MediaDisplayBadge from "@/app/admin/components/MediaDisplayBadge";
import type { MediaDisplayStatus } from "@/lib/media-consent-shared";
import { adminFetchJson } from "@/lib/admin-fetch-shared";

type AdminMediaOptOutToggleProps = {
  memberId?: string;
  waiverSignatureId?: string;
  mediaDisplayStatus: MediaDisplayStatus;
  mediaOptOutAll: boolean;
  onUpdated?: (next: { mediaDisplayStatus: MediaDisplayStatus; mediaOptOutAll: boolean }) => void;
};

export default function AdminMediaOptOutToggle(props: AdminMediaOptOutToggleProps) {
  const [mediaOptOutAll, setMediaOptOutAll] = useState(props.mediaOptOutAll);
  const [mediaDisplayStatus, setMediaDisplayStatus] = useState(props.mediaDisplayStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (next: boolean) => {
    setSaving(true);
    setError("");
    const url = props.memberId
      ? `/api/admin/members/${props.memberId}/media-opt-out`
      : `/api/admin/waivers/${props.waiverSignatureId}/media-opt-out`;

    const res = await adminFetchJson<{
      error?: string;
      mediaOptOutAll?: boolean;
      mediaDisplayStatus?: MediaDisplayStatus;
    }>(
      url,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaOptOutAll: next }),
      },
      { context: "admin-media-opt-out", okUserMessage: "Unable to save." },
    );

    setSaving(false);

    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    const data = res.data;
    if (typeof data.mediaOptOutAll !== "boolean" || !data.mediaDisplayStatus) {
      setError("Unable to save.");
      return;
    }

    setMediaOptOutAll(data.mediaOptOutAll);
    setMediaDisplayStatus(data.mediaDisplayStatus);
    props.onUpdated?.({
      mediaOptOutAll: data.mediaOptOutAll,
      mediaDisplayStatus: data.mediaDisplayStatus,
    });
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-zinc-100">Media:</span>
        <MediaDisplayBadge status={mediaDisplayStatus} />
      </div>
      <label className="flex items-center justify-between gap-4 rounded-xl border border-[#2b3650] bg-black/20 px-3 py-3">
        <span className="text-sm text-zinc-300">Keep out of all footage</span>
        <button
          type="button"
          role="switch"
          aria-checked={mediaOptOutAll}
          disabled={saving}
          onClick={() => void save(!mediaOptOutAll)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
            mediaOptOutAll ? "bg-[#52B788]" : "bg-zinc-600"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              mediaOptOutAll ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
