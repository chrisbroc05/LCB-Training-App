"use client";

import { useState } from "react";
import {
  MEMBERSHIP_LEVEL_KEYS,
  formatMembershipLevelLabel,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";
import type { MemberDetail } from "@/app/admin/MemberDetailContent";

type AdminMembershipLevelSectionProps = {
  detail: MemberDetail;
  onUpdated: (member: MemberDetail) => void;
};

export default function AdminMembershipLevelSection({
  detail,
  onUpdated,
}: AdminMembershipLevelSectionProps) {
  const [levelDraft, setLevelDraft] = useState<string>(detail.membershipLevel ?? "");
  const [expiresDraft, setExpiresDraft] = useState(
    detail.membershipLevelExpiresAt
      ? detail.membershipLevelExpiresAt.slice(0, 10)
      : "",
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/members/${detail.id}/membership-level`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipLevel: levelDraft || null,
          membershipLevelExpiresAt: expiresDraft ? `${expiresDraft}T23:59:59.000Z` : null,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        member?: MemberDetail;
      };
      if (!response.ok || !data.member) {
        setError(data.error ?? "Unable to update membership level.");
        return;
      }

      const expectedLevel = levelDraft ? (levelDraft as MembershipLevelKey) : null;
      if (data.member.membershipLevel !== expectedLevel) {
        setError(
          `Save did not persist (expected level ${expectedLevel ?? "none"}, got ${data.member.membershipLevel ?? "none"}). Refresh and try again.`,
        );
        return;
      }

      const expectedExpiresPrefix = expiresDraft || null;
      const savedExpires = data.member.membershipLevelExpiresAt?.slice(0, 10) ?? null;
      if (expectedExpiresPrefix !== savedExpires) {
        setError("Membership level expiry did not save correctly. Refresh and try again.");
        return;
      }

      onUpdated(data.member);
      setSuccess(`Saved: ${data.member.planDisplayLabel}${data.member.planExpiryLabel ? ` (${data.member.planExpiryLabel})` : ""}.`);
    } catch {
      setError("Unable to update membership level right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
      <p className="text-sm font-semibold text-zinc-100">Membership level (Core / Plus / All-Access)</p>
      <p className="mt-2 text-xs text-zinc-400">
        Grants app access for testing or comps. Optional end date. All-Access also enables open-ended
        program enrollment.
      </p>
      <label className="mt-4 block text-sm text-zinc-300">
        Level
        <select
          value={levelDraft}
          onChange={(event) => setLevelDraft(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
        >
          <option value="">None</option>
          {MEMBERSHIP_LEVEL_KEYS.map((key) => (
            <option key={key} value={key}>
              {formatMembershipLevelLabel(key)}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-sm text-zinc-300">
        Expires (optional)
        <input
          type="date"
          value={expiresDraft}
          onChange={(event) => setExpiresDraft(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-[#9df3bd]">{success}</p> : null}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save level"}
      </button>
    </div>
  );
}
