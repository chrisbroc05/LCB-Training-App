"use client";

import { useState } from "react";
import {
  ARTICLE_LEAD_OFFER_COPY,
  ARTICLE_LEAD_SUCCESS_COPY,
} from "@/lib/articles-lead-shared";
import { LEAD_ROLE_OPTIONS, type LeadRoleValue } from "@/lib/resources-shared";

type ArticleLeadCaptureFormProps = {
  articleSlug: string;
  compact?: boolean;
};

export default function ArticleLeadCaptureForm({
  articleSlug,
  compact = false,
}: ArticleLeadCaptureFormProps) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [role, setRole] = useState<LeadRoleValue>("PLAYER");
  const [playerAge13Plus, setPlayerAge13Plus] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const playerUnder13 = role === "PLAYER" && playerAge13Plus === false;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/articles/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleSlug,
          firstName,
          email: playerUnder13 ? "" : email,
          role,
          playerAge13Plus: role === "PLAYER" ? playerAge13Plus : undefined,
          parentEmail: playerUnder13 ? parentEmail : undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Unable to send the printable plan.");
      }
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <aside
        className={`rounded-2xl border border-[#52B788]/40 bg-[#0b1324] ${compact ? "px-4 py-4" : "px-5 py-5 sm:px-6"}`}
      >
        <p className="text-sm font-semibold text-[#9df3bd] sm:text-base">{ARTICLE_LEAD_SUCCESS_COPY}</p>
      </aside>
    );
  }

  return (
    <aside
      className={`rounded-2xl border border-[#18243a] bg-[#0b1324] ${compact ? "px-4 py-4" : "px-5 py-5 sm:px-6"}`}
    >
      <p
        className={`font-[family-name:var(--font-article-display)] font-bold tracking-wide text-white ${compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}
      >
        {ARTICLE_LEAD_OFFER_COPY}
      </p>

      <form className={`space-y-3 ${compact ? "mt-4" : "mt-5"}`} onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-zinc-300">
            First name
            <input
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-3 py-2.5 text-sm text-white"
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Role
            <select
              aria-label="Are you the player, parent, or coach?"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as LeadRoleValue);
                setPlayerAge13Plus(null);
              }}
              className="mt-1.5 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-3 py-2.5 text-sm text-white"
            >
              {LEAD_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {role === "PLAYER" ? (
          <fieldset className="space-y-2">
            <legend className="text-sm text-zinc-300">Are you 13 or older?</legend>
            <div className="mt-1.5 flex gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name={`playerAge13Plus-${articleSlug}-${compact ? "top" : "bottom"}`}
                  checked={playerAge13Plus === true}
                  onChange={() => setPlayerAge13Plus(true)}
                  required={playerAge13Plus === null}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name={`playerAge13Plus-${articleSlug}-${compact ? "top" : "bottom"}`}
                  checked={playerAge13Plus === false}
                  onChange={() => setPlayerAge13Plus(false)}
                />
                No
              </label>
            </div>
          </fieldset>
        ) : null}

        {playerUnder13 ? (
          <label className="block text-sm text-zinc-300">
            Parent or guardian email
            <input
              required
              type="email"
              autoComplete="email"
              value={parentEmail}
              onChange={(event) => setParentEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-3 py-2.5 text-sm text-white"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              We email your parent, not you. Do not enter a child email here.
            </span>
          </label>
        ) : (
          <label className="block text-sm text-zinc-300">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-3 py-2.5 text-sm text-white"
            />
          </label>
        )}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Sending..." : "Email me the PDF"}
        </button>

        <p className="text-xs leading-relaxed text-zinc-500">
          By continuing, you agree to get training tips and offers from Coach Broc by email.
          Unsubscribe anytime.
        </p>
      </form>
    </aside>
  );
}
