"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminFetchJson,
  ADMIN_FETCH_COULD_NOT_LOAD_JSON,
} from "@/lib/admin-fetch-shared";
import type { TestSessionSummary } from "@/lib/testing-shared";

type TeamDetail = {
  team: {
    id: string;
    name: string;
    teamSlug: string;
  };
  sessions: TestSessionSummary[];
};

export default function TestingTeamPanel({ teamId }: { teamId: string }) {
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDetail() {
    setError(null);
    const res = await adminFetchJson<TeamDetail & { error?: string }>(
      `/api/admin/testing/teams/${encodeURIComponent(teamId)}`,
      { cache: "no-store" },
      {
        context: "testing-team-detail",
        okUserMessage: "Couldn't load testing results. Try again.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      throw new Error(res.userMessage);
    }
    setDetail(res.data);
  }

  useEffect(() => {
    void loadDetail().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load team.");
    });
  }, [teamId]);

  if (!detail) {
    return <p className="text-sm text-zinc-400">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/testing" className="text-sm text-zinc-400 hover:text-zinc-200">
          Back to testing
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">{detail.team.name}</h1>
        <p className="mt-1 text-sm text-zinc-400">Past session results</p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Sessions</h2>
        <div className="mt-4 space-y-2">
          {detail.sessions.length === 0 ? (
            <p className="text-sm text-zinc-400">No sessions yet.</p>
          ) : (
            detail.sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2b3650] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{session.label}</p>
                  <p className="text-xs text-zinc-400">
                    {session.date} | {session.resultCount} results
                  </p>
                </div>
                <Link
                  href={`/admin/testing/teams/${teamId}/sessions/${session.id}`}
                  className="rounded-full border border-[#2b3650] px-4 py-2 text-xs font-semibold text-zinc-300"
                >
                  Results grid
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
