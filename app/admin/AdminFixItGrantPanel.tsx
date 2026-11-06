"use client";

import { useState } from "react";
import { adminFetchJson } from "@/lib/admin-fetch-shared";
import { FIX_IT_PLANS } from "@/lib/fix-it-plans-shared";
import type { MemberDetail } from "@/app/admin/MemberDetailContent";

type AdminFixItGrantPanelProps = {
  memberId: string;
  membershipLevel: MemberDetail["membershipLevel"];
  onUpdated: (member: MemberDetail) => void;
};

export default function AdminFixItGrantPanel({
  memberId,
  membershipLevel,
  onUpdated,
}: AdminFixItGrantPanelProps) {
  const canGrant = membershipLevel === "PLUS" || membershipLevel === "ALL_ACCESS";
  const [resourceSlug, setResourceSlug] = useState(FIX_IT_PLANS[0]?.resourceSlug ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!canGrant) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await adminFetchJson<{
        error?: string;
        message?: string;
        member?: MemberDetail;
      }>(
        `/api/admin/members/${memberId}/fix-it-grant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceSlug }),
        },
        { context: "admin-fix-it-grant", okUserMessage: "Unable to grant Fix-It access." },
      );

      if (!res.ok || !res.data.member) {
        throw new Error(res.ok ? "Unable to grant Fix-It access." : res.userMessage);
      }

      onUpdated(res.data.member);
      setSuccess(res.data.message ?? "Granted.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to grant Fix-It access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
      <p className="text-sm font-semibold text-zinc-100">Fix-It plan grant</p>
      <p className="mt-1 text-xs text-zinc-400">
        Give this Plus or All Access member access to a Fix-It plan without a purchase.
      </p>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
        <label className="block text-sm text-zinc-300">
          Plan
          <select
            value={resourceSlug}
            onChange={(event) => setResourceSlug(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
          >
            {FIX_IT_PLANS.map((plan) => (
              <option key={plan.resourceSlug} value={plan.resourceSlug}>
                {plan.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading || !resourceSlug}
          className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Saving..." : "Grant Fix-It access"}
        </button>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-[#9df3bd]">{success}</p> : null}
      </form>
    </div>
  );
}
