"use client";

import { useState } from "react";
import type { MemberDetail } from "@/app/admin/MemberDetailContent";

type AdminMemberCommissionPanelProps = {
  memberId: string;
  commission: NonNullable<MemberDetail["commission"]>;
  onUpdated: (member: MemberDetail) => void;
};

export default function AdminMemberCommissionPanel({
  memberId,
  commission,
  onUpdated,
}: AdminMemberCommissionPanelProps) {
  const [countForCommission, setCountForCommission] = useState(
    commission.commissionEligibleAdminOverride,
  );
  const [note, setNote] = useState(commission.commissionOverrideNote ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/members/${memberId}/commission-override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countForCommission,
          note: note.trim() || null,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        member?: MemberDetail;
      };
      if (!response.ok || !data.member) {
        throw new Error(data.error ?? "Unable to save commission override.");
      }
      onUpdated(data.member);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save commission override.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
      <p className="text-sm font-semibold text-zinc-100">
        Commission: {commission.orgName} - {commission.eligibilityLabel}
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={countForCommission}
          onChange={(event) => setCountForCommission(event.target.checked)}
        />
        Count for {commission.orgName} commission
      </label>
      <label className="mt-3 block text-sm text-zinc-300">
        Optional note
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
        />
      </label>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleSave()}
        className="mt-3 rounded-lg bg-[#52B788] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save commission override"}
      </button>
    </div>
  );
}
