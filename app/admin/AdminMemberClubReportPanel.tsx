"use client";

import { useState } from "react";
import type { MemberDetail } from "@/app/admin/MemberDetailContent";

type AdminMemberClubReportPanelProps = {
  memberId: string;
  organizationName: string;
  clubReportExcluded: boolean;
  onUpdated: (member: MemberDetail) => void;
};

export default function AdminMemberClubReportPanel({
  memberId,
  organizationName,
  clubReportExcluded,
  onUpdated,
}: AdminMemberClubReportPanelProps) {
  const [excluded, setExcluded] = useState(clubReportExcluded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/members/${memberId}/club-report-excluded`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excluded }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        member?: MemberDetail;
      };
      if (!response.ok || !data.member) {
        throw new Error(data.error ?? "Unable to save club report setting.");
      }
      onUpdated(data.member);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save club report setting.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
      <p className="text-sm font-semibold text-zinc-100">Club report ({organizationName})</p>
      <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={excluded}
          onChange={(event) => setExcluded(event.target.checked)}
        />
        Exclude from club report counts
      </label>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleSave()}
        className="mt-3 rounded-lg bg-[#52B788] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}
