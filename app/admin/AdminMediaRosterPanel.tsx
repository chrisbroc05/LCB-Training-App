"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MediaDisplayBadge from "@/app/admin/components/MediaDisplayBadge";
import {
  MEDIA_DISPLAY_FILTER_OPTIONS,
  type MediaDisplayFilter,
  type UnifiedAgreementRecord,
} from "@/lib/admin-agreements-shared";

export default function AdminMediaRosterPanel() {
  const [teamFilter, setTeamFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaDisplayFilter>("ALL");
  const [teams, setTeams] = useState<string[]>([]);
  const [records, setRecords] = useState<UnifiedAgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (teamFilter.trim()) {
      params.set("team", teamFilter.trim());
    }
    if (mediaFilter !== "ALL") {
      params.set("media", mediaFilter);
    }
    const response = await fetch(`/api/admin/waivers?${params.toString()}`, { cache: "no-store" });
    setLoading(false);
    if (!response.ok) {
      setRecords([]);
      return;
    }
    const data = (await response.json()) as {
      agreements?: UnifiedAgreementRecord[];
      teams?: string[];
    };
    setRecords(data.agreements ?? []);
    setTeams(data.teams ?? []);
  }, [teamFilter, mediaFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => [...records].sort((a, b) => a.playerName.localeCompare(b.playerName)),
    [records],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-zinc-300">
          Team / clinic
          <select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0A1628]/80 px-3 py-2.5 text-sm text-zinc-100"
          >
            <option value="">All teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-zinc-300">
          Media filter
          <select
            value={mediaFilter}
            onChange={(event) => setMediaFilter(event.target.value as MediaDisplayFilter)}
            className="mt-1 w-full rounded-xl border border-[#2b3650] bg-[#0A1628]/80 px-3 py-2.5 text-sm text-zinc-100"
          >
            {MEDIA_DISPLAY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p className="text-sm text-zinc-400">Loading...</p> : null}

      {!loading && sorted.length === 0 ? (
        <p className="text-sm text-zinc-400">No players match this filter.</p>
      ) : null}

      <ul className="divide-y divide-[#2b3650] rounded-2xl border border-[#18243a] bg-[#0b1324]/80">
        {sorted.map((record) => (
          <li
            key={record.id}
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-zinc-100">{record.playerName}</p>
              {record.teamName ? (
                <p className="truncate text-xs text-zinc-500">{record.teamName}</p>
              ) : null}
            </div>
            <MediaDisplayBadge status={record.mediaDisplayStatus} />
          </li>
        ))}
      </ul>
    </div>
  );
}
