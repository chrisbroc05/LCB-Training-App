"use client";

import { useState } from "react";
import {
  ADMIN_GRANT_PRODUCTS,
  getAdminGrantProductLabel,
  type AdminGrantProduct,
} from "@/lib/admin-product-access-shared";
import type { MemberDetail } from "@/app/admin/MemberDetailContent";

type AdminProductAccessPanelProps = {
  memberId: string;
  memberEmail: string;
  productAccess: MemberDetail["productAccess"];
  onUpdated: (member: MemberDetail) => void;
  compact?: boolean;
};

export default function AdminProductAccessPanel({
  memberId,
  memberEmail,
  productAccess,
  onUpdated,
  compact = false,
}: AdminProductAccessPanelProps) {
  const [product, setProduct] = useState<AdminGrantProduct>("playbook");
  const [action, setAction] = useState<"grant" | "remove">("grant");
  const [stripePaidOn, setStripePaidOn] = useState("");
  const [skipEmail, setSkipEmail] = useState(false);
  const [playbookLegacyAccess, setPlaybookLegacyAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showEmailOptions =
    action === "grant" && (product === "playbook" || product === "remote_session");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/members/${memberId}/product-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          product,
          stripePaidOn: stripePaidOn.trim() || undefined,
          skipEmail: showEmailOptions ? skipEmail : undefined,
          playbookLegacyAccess:
            action === "grant" && product === "playbook" ? playbookLegacyAccess : undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        member?: MemberDetail;
      };

      if (!response.ok || !data.member) {
        throw new Error(data.error ?? "Unable to update product access.");
      }

      onUpdated(data.member);
      setSuccess(data.message ?? "Updated.");
      if (action === "grant") {
        setStripePaidOn("");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update product access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-[#2b3650] bg-black/30 p-4"
          : "rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4"
      }
    >
      <p className="text-sm font-semibold text-zinc-100">Grant access</p>
      {!compact ? (
        <p className="mt-1 text-xs text-zinc-400">
          Grant or remove product access for {memberEmail}. Updates are logged in private coach notes.
        </p>
      ) : null}

      <div className="mt-3 rounded-lg border border-[#2b3650]/80 bg-black/20 p-3 text-sm text-zinc-300">
        <p>
          <span className="font-semibold text-zinc-100">Tier:</span> {productAccess.tierLabel}
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-zinc-400">
          {productAccess.productLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-zinc-300">
            Product
            <select
              value={product}
              onChange={(event) => setProduct(event.target.value as AdminGrantProduct)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
            >
              {ADMIN_GRANT_PRODUCTS.map((option) => (
                <option key={option} value={option}>
                  {getAdminGrantProductLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-zinc-300">
            Action
            <select
              value={action}
              onChange={(event) => setAction(event.target.value as "grant" | "remove")}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
            >
              <option value="grant">Grant access</option>
              <option value="remove">Remove access</option>
            </select>
          </label>
        </div>

        {action === "grant" ? (
          <label className="block text-sm text-zinc-300">
            Stripe payment date (optional)
            <input
              type="date"
              value={stripePaidOn}
              onChange={(event) => setStripePaidOn(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-zinc-100"
            />
          </label>
        ) : null}

        {action === "grant" && product === "playbook" ? (
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={playbookLegacyAccess}
              onChange={(event) => setPlaybookLegacyAccess(event.target.checked)}
              className="rounded border-[#2b3650]"
            />
            Full Playbook (legacy access)
          </label>
        ) : null}

        {showEmailOptions ? (
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={skipEmail}
              onChange={(event) => setSkipEmail(event.target.checked)}
              className="rounded border-[#2b3650]"
            />
            Skip confirmation email
          </label>
        ) : null}

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-[#9df3bd]">{success}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex rounded-full bg-[#2D6A4F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Saving..." : action === "grant" ? "Grant access" : "Remove access"}
        </button>
      </form>
    </div>
  );
}
