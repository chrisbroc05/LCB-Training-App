"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format-date";
import {
  AGREEMENT_SOURCE_FILTER_OPTIONS,
  formatRosterPlayerStatusLabel,
  getRosterPlayerStatuses,
  type AgreementSourceFilter,
  type UnifiedAgreementRecord,
} from "@/lib/admin-agreements-shared";
import {
  formatWaiverSignupTypeLabel,
  parseRosterNames,
  type WaiverSignupType,
} from "@/lib/waiver-sign-shared";

function copyToClipboard(value: string) {
  void navigator.clipboard.writeText(value);
}

export default function AdminWaiversPanel() {
  const [agreements, setAgreements] = useState<UnifiedAgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<AgreementSourceFilter>("all");
  const [teamLinkName, setTeamLinkName] = useState("");
  const [rosterText, setRosterText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  const loadAgreements = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (teamFilter.trim()) {
      params.set("team", teamFilter.trim());
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (sourceFilter !== "all") {
      params.set("source", sourceFilter);
    }

    const response = await fetch(`/api/admin/waivers?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as {
      agreements?: UnifiedAgreementRecord[];
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to load agreements.");
      return;
    }

    setAgreements(data.agreements ?? []);
  }, [teamFilter, search, sourceFilter]);

  useEffect(() => {
    void loadAgreements();
  }, [loadAgreements]);

  const selected = agreements.find((record) => record.id === selectedId) ?? null;
  const generalSignUrl =
    typeof window === "undefined" ? "/sign" : `${window.location.origin}/sign`;
  const teamSignUrl =
    typeof window === "undefined"
      ? "/sign"
      : `${window.location.origin}/sign?team=${encodeURIComponent(teamLinkName.trim())}`;

  const rosterStatuses = useMemo(() => {
    if (!teamFilter.trim()) {
      return [];
    }

    return getRosterPlayerStatuses(parseRosterNames(rosterText), agreements);
  }, [teamFilter, rosterText, agreements]);

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
    if (sourceFilter !== "all") {
      params.set("source", sourceFilter);
    }

    window.location.href = `/api/admin/waivers/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Signed agreements</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Waiver link signatures and app signup agreements in one list.
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            Source
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as AgreementSourceFilter)}
              className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
            >
              {AGREEMENT_SOURCE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-300 sm:col-span-2 lg:col-span-1">
            Search
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Player, email, signer, team"
              className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-400">
            {teamFilter.trim()
              ? `${agreements.length} agreements for ${teamFilter.trim()}`
              : `${agreements.length} agreements`}
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
              Paste roster (one player name per line) to see signing status
              <textarea
                rows={5}
                value={rosterText}
                onChange={(event) => setRosterText(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#2b3650] bg-black px-4 py-3 text-sm text-zinc-100"
              />
            </label>
            {rosterText.trim() ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-zinc-200">Roster status</p>
                {rosterStatuses.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-400">Add player names to check status.</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                    {rosterStatuses.map((entry) => (
                      <li key={entry.name}>
                        {entry.name}:{" "}
                        <span
                          className={
                            entry.status === "unsigned"
                              ? "text-red-300"
                              : entry.status === "signed_no_emergency"
                                ? "text-yellow-200"
                                : "text-[#52B788]"
                          }
                        >
                          {formatRosterPlayerStatusLabel(entry.status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {loading ? <p className="text-sm text-zinc-400">Loading agreements...</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="space-y-3">
        {agreements.map((record) => (
          <button
            key={record.id}
            type="button"
            onClick={() => setSelectedId(record.id)}
            className="block w-full rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 px-4 py-4 text-left transition hover:border-[#52B788]/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-100">{record.playerName}</p>
                  {record.isTwelveWeekPlayer ? (
                    <span className="rounded-full bg-[#52B788]/20 px-2 py-0.5 text-xs font-semibold text-[#52B788]">
                      12-Week
                    </span>
                  ) : null}
                  {record.trainsInPerson ? (
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-200">
                      In person
                    </span>
                  ) : null}
                  {record.isOutdatedVersion ? (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                      Outdated version
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {record.sourceLabels.join(" + ")}
                  {record.playerAge != null ? ` | Age ${record.playerAge}` : ""}
                  {record.teamName ? ` | ${record.teamName}` : ""}
                  {record.signupType
                    ? ` | ${formatWaiverSignupTypeLabel(record.signupType as WaiverSignupType)}`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {record.email}
                  {record.acceptedByName ? ` | Agreed by ${record.acceptedByName}` : ""}
                  {" | "}
                  {formatDateTime(record.signedAt)}
                </p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>{record.version}</p>
                <p className="mt-1">{record.mediaConsent ? "Media yes" : "Media no"}</p>
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
              <dt className="text-zinc-500">Source</dt>
              <dd>{selected.sourceLabels.join(" + ")}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd>{selected.email}</dd>
            </div>
            {selected.accountName ? (
              <div>
                <dt className="text-zinc-500">Account name</dt>
                <dd>{selected.accountName}</dd>
              </div>
            ) : null}
            {selected.playerAge != null ? (
              <div>
                <dt className="text-zinc-500">Age</dt>
                <dd>{selected.playerAge}</dd>
              </div>
            ) : null}
            {selected.teamName ? (
              <div>
                <dt className="text-zinc-500">Team</dt>
                <dd>{selected.teamName}</dd>
              </div>
            ) : null}
            {selected.signupType ? (
              <div>
                <dt className="text-zinc-500">Signup type</dt>
                <dd>{formatWaiverSignupTypeLabel(selected.signupType as WaiverSignupType)}</dd>
              </div>
            ) : null}
            {selected.signerFullName ? (
              <div>
                <dt className="text-zinc-500">Signer</dt>
                <dd>{selected.signerFullName}</dd>
              </div>
            ) : null}
            {selected.acceptedByName ? (
              <div>
                <dt className="text-zinc-500">Agreed by</dt>
                <dd>
                  {selected.acceptedByName}
                  {selected.agreementRoleLabel ? ` (${selected.agreementRoleLabel})` : ""}
                </dd>
              </div>
            ) : null}
            {selected.signedUpBy ? (
              <div>
                <dt className="text-zinc-500">Signed up by</dt>
                <dd>{selected.signedUpBy}</dd>
              </div>
            ) : null}
            {selected.parentConsentStatus ? (
              <div>
                <dt className="text-zinc-500">Parent confirmation</dt>
                <dd>{selected.parentConsentStatus}</dd>
              </div>
            ) : null}
            {selected.signerPhone ? (
              <div>
                <dt className="text-zinc-500">Signer phone</dt>
                <dd>{selected.signerPhone}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-zinc-500">In person</dt>
              <dd>{selected.trainsInPerson ? "Yes" : "No"}</dd>
            </div>
            {selected.emergencyContactName || selected.emergencyContactPhone ? (
              <div>
                <dt className="text-zinc-500">Emergency contact</dt>
                <dd>
                  {selected.emergencyContactName ?? "Unknown"} (
                  {selected.emergencyContactPhone ?? "Unknown"})
                </dd>
              </div>
            ) : null}
            {selected.medicalNotes?.trim() ? (
              <div>
                <dt className="text-zinc-500">Medical notes</dt>
                <dd>{selected.medicalNotes}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-zinc-500">Media consent</dt>
              <dd>{selected.mediaConsent ? "Yes" : "No"}</dd>
            </div>
            {selected.typedSignature ? (
              <div>
                <dt className="text-zinc-500">Typed signature</dt>
                <dd>{selected.typedSignature}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-zinc-500">Version</dt>
              <dd>
                {selected.version}
                {selected.isOutdatedVersion ? " (outdated)" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Signed at</dt>
              <dd>{formatDateTime(selected.signedAt)}</dd>
            </div>
            {selected.isTwelveWeekPlayer ? (
              <div>
                <dt className="text-zinc-500">12-Week player</dt>
                <dd>Yes</dd>
              </div>
            ) : null}
            {selected.ip ? (
              <div>
                <dt className="text-zinc-500">IP</dt>
                <dd>{selected.ip}</dd>
              </div>
            ) : null}
            {selected.userId ? (
              <div>
                <dt className="text-zinc-500">App user</dt>
                <dd>
                  <Link href={`/admin/members/${selected.userId}`} className="text-[#52B788]">
                    View member
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
