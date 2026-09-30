"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format-date";
import {
  findUnsignedRosterNames,
  formatWaiverSignupTypeLabel,
  parseRosterNames,
  type WaiverSignupType,
} from "@/lib/waiver-sign-shared";

type WaiverSignatureRecord = {
  id: string;
  playerName: string;
  playerFirstName: string;
  playerLastName: string;
  playerAge: number;
  teamName: string | null;
  teamSlug: string | null;
  signupType: WaiverSignupType;
  signerFullName: string;
  signerEmail: string;
  signerPhone: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string | null;
  mediaConsent: boolean;
  typedSignature: string;
  version: string;
  signedAt: string;
  ip: string;
};

function copyToClipboard(value: string) {
  void navigator.clipboard.writeText(value);
}

export default function AdminWaiversPanel() {
  const [signatures, setSignatures] = useState<WaiverSignatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [search, setSearch] = useState("");
  const [teamLinkName, setTeamLinkName] = useState("");
  const [rosterText, setRosterText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  const loadSignatures = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (teamFilter.trim()) {
      params.set("team", teamFilter.trim());
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }

    const response = await fetch(`/api/admin/waivers?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as {
      signatures?: WaiverSignatureRecord[];
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to load waivers.");
      return;
    }

    setSignatures(data.signatures ?? []);
  }, [teamFilter, search]);

  useEffect(() => {
    void loadSignatures();
  }, [loadSignatures]);

  const selected = signatures.find((signature) => signature.id === selectedId) ?? null;
  const generalSignUrl =
    typeof window === "undefined" ? "/sign" : `${window.location.origin}/sign`;
  const teamSignUrl =
    typeof window === "undefined"
      ? "/sign"
      : `${window.location.origin}/sign?team=${encodeURIComponent(teamLinkName.trim())}`;

  const unsignedRoster = useMemo(() => {
    if (!teamFilter.trim()) {
      return [];
    }

    return findUnsignedRosterNames(
      parseRosterNames(rosterText),
      signatures.map((signature) => signature.playerName),
    );
  }, [teamFilter, rosterText, signatures]);

  const showCopied = (message: string) => {
    setCopyMessage(message);
    window.setTimeout(() => setCopyMessage(""), 2000);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (teamFilter.trim()) {
      params.set("team", teamFilter.trim());
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }

    window.location.href = `/api/admin/waivers/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Signed waivers</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Lesson and team players who signed outside the app.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-[#52B788]">
          Back to admin
        </Link>
      </div>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Share sign links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              copyToClipboard(generalSignUrl);
              showCopied("General link copied.");
            }}
            className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788]"
          >
            Copy general /sign link
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-zinc-300">
            Create team link
            <input
              type="text"
              value={teamLinkName}
              onChange={(event) => setTeamLinkName(event.target.value)}
              placeholder="Team name"
              className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
            />
          </label>
          <button
            type="button"
            disabled={!teamLinkName.trim()}
            onClick={() => {
              copyToClipboard(teamSignUrl);
              showCopied("Team link copied.");
            }}
            className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            Copy team link
          </button>
        </div>
        {copyMessage ? <p className="mt-3 text-sm text-[#52B788]">{copyMessage}</p> : null}
      </section>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-zinc-300">
            Filter by team
            <input
              type="text"
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              placeholder="Team name"
              className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
            />
          </label>
          <label className="text-sm text-zinc-300">
            Search
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Player, signer, email, team"
              className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-400">
            {teamFilter.trim()
              ? `${signatures.length} signed for ${teamFilter.trim()}`
              : `${signatures.length} signed`}
          </p>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Export CSV
          </button>
        </div>

        {teamFilter.trim() ? (
          <div className="mt-5">
            <label className="text-sm text-zinc-300">
              Paste roster (one player name per line) to see who has not signed yet
              <textarea
                rows={5}
                value={rosterText}
                onChange={(event) => setRosterText(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
              />
            </label>
            {rosterText.trim() ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-zinc-200">Not signed yet</p>
                {unsignedRoster.length === 0 ? (
                  <p className="mt-2 text-sm text-[#52B788]">Everyone on this roster has signed.</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                    {unsignedRoster.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {loading ? <p className="text-sm text-zinc-400">Loading waivers...</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="space-y-3">
        {signatures.map((signature) => (
          <button
            key={signature.id}
            type="button"
            onClick={() => setSelectedId(signature.id)}
            className="block w-full rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 px-4 py-4 text-left transition hover:border-[#52B788]/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-100">{signature.playerName}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Age {signature.playerAge}
                  {signature.teamName ? ` | ${signature.teamName}` : ""} |{" "}
                  {formatWaiverSignupTypeLabel(signature.signupType)}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Signed by {signature.signerFullName} on {formatDateTime(signature.signedAt)}
                </p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>{signature.version}</p>
                <p className="mt-1">{signature.mediaConsent ? "Media yes" : "Media no"}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected ? (
        <section className="rounded-2xl border border-[#52B788]/40 bg-[#0b1324]/90 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-zinc-100">{selected.playerName}</h2>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-sm text-zinc-400"
            >
              Close
            </button>
          </div>
          <dl className="mt-4 space-y-3 text-sm text-zinc-300">
            <div>
              <dt className="text-zinc-500">Age</dt>
              <dd>{selected.playerAge}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Team</dt>
              <dd>{selected.teamName ?? "None"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Signup type</dt>
              <dd>{formatWaiverSignupTypeLabel(selected.signupType)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Signer</dt>
              <dd>{selected.signerFullName}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Signer email</dt>
              <dd>{selected.signerEmail}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Signer phone</dt>
              <dd>{selected.signerPhone ?? "None"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Emergency contact</dt>
              <dd>
                {selected.emergencyContactName} ({selected.emergencyContactPhone})
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Medical notes</dt>
              <dd>{selected.medicalNotes?.trim() || "None"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Media consent</dt>
              <dd>{selected.mediaConsent ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Typed signature</dt>
              <dd>{selected.typedSignature}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Version</dt>
              <dd>{selected.version}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Signed at</dt>
              <dd>{formatDateTime(selected.signedAt)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">IP</dt>
              <dd>{selected.ip}</dd>
            </div>
            {selected.teamSlug ? (
              <div>
                <dt className="text-zinc-500">Team slug</dt>
                <dd>{selected.teamSlug}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
