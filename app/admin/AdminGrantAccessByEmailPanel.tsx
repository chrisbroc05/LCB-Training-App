"use client";

import { useState } from "react";
import {
  ADMIN_GRANT_PRODUCTS,
  getAdminGrantProductLabel,
  type AdminGrantProduct,
} from "@/lib/admin-product-access-shared";

type AdminGrantAccessByEmailPanelProps = {
  onSuccess?: () => void;
  initialEmail?: string;
};

export default function AdminGrantAccessByEmailPanel({
  onSuccess,
  initialEmail = "",
}: AdminGrantAccessByEmailPanelProps) {
  const [email, setEmail] = useState(initialEmail);
  const [product, setProduct] = useState<AdminGrantProduct>("twelve_week_program");
  const [action, setAction] = useState<"grant" | "remove">("grant");
  const [stripePaidOn, setStripePaidOn] = useState("");
  const [skipEmail, setSkipEmail] = useState(false);
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
      const response = await fetch("/api/admin/grant-product-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          action,
          product,
          stripePaidOn: stripePaidOn.trim() || undefined,
          skipEmail: showEmailOptions ? skipEmail : undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        user?: { email: string };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update product access.");
      }

      setSuccess(data.message ?? `Updated access for ${data.user?.email ?? email}.`);
      if (action === "grant") {
        setEmail("");
        setStripePaidOn("");
      }
      onSuccess?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update product access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex w-full flex-col gap-3 lg:max-w-2xl">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="player@email.com"
        className="w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-zinc-100"
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={product}
          onChange={(event) => setProduct(event.target.value as AdminGrantProduct)}
          className="w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
        >
          {ADMIN_GRANT_PRODUCTS.map((option) => (
            <option key={option} value={option}>
              {getAdminGrantProductLabel(option)}
            </option>
          ))}
        </select>
        <select
          value={action}
          onChange={(event) => setAction(event.target.value as "grant" | "remove")}
          className="w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
        >
          <option value="grant">Grant access</option>
          <option value="remove">Remove access</option>
        </select>
      </div>
      {action === "grant" ? (
        <input
          type="date"
          value={stripePaidOn}
          onChange={(event) => setStripePaidOn(event.target.value)}
          className="w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
          aria-label="Stripe payment date"
        />
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
        className="rounded-xl bg-[#2D6A4F] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {loading ? "Saving..." : action === "grant" ? "Grant access" : "Remove access"}
      </button>
    </form>
  );
}
