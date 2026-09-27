"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PlayerCard = {
  enrollmentId: string;
  name: string;
  email: string;
  weekNumber: number;
  programDay: number;
  phase: string;
  todayDone: number;
  todayTotal: number;
  streak: number;
  lastCheckIn: string;
  weeklyVideoSent: boolean;
  seasonMode: string | null;
  goneQuiet: boolean;
  finishedToday: boolean;
};

type LatestNote = {
  enrollmentId: string;
  playerName: string;
  taskTitle: string;
  programDay: number;
  note: string;
  relativeTime: string;
};

export default function AdminProgramOverview() {
  const [players, setPlayers] = useState<PlayerCard[]>([]);
  const [latestNotes, setLatestNotes] = useState<LatestNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/program/overview");
        const data = (await response.json().catch(() => ({}))) as {
          players?: PlayerCard[];
          latestNotes?: LatestNote[];
          error?: string;
        };
        if (!response.ok || !data.players) {
          throw new Error(data.error ?? "Unable to load program overview.");
        }
        setPlayers(data.players);
        setLatestNotes(data.latestNotes ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load program overview.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Program Overview</h1>
            <p className="mt-2 text-sm text-zinc-400">Active 12-week players at a glance.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/program/cues"
              className="inline-flex rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788]"
            >
              My Hitting Focuses
            </Link>
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-300"
            >
              Back to admin
            </Link>
          </div>
        </div>
      </section>

      {loading ? <p className="text-sm text-zinc-400">Loading players...</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="space-y-3">
        {players.map((player) => (
          <Link
            key={player.enrollmentId}
            href={`/admin/program/${player.enrollmentId}`}
            className="block rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 transition hover:border-[#52B788]/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-zinc-100">{player.name}</h2>
                  {player.goneQuiet ? (
                    <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-200">
                      Gone quiet
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Week {player.weekNumber} . Day {player.programDay} . {player.phase}
                </p>
              </div>
              <div className="text-right text-sm text-zinc-300">
                <p>
                  Today: {player.todayDone} of {player.todayTotal}
                </p>
                <p>Streak: {player.streak}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
              <span>Last check-in: {player.lastCheckIn}</span>
              <span>Video: {player.weeklyVideoSent ? "Sent" : "Not sent"}</span>
              <span>
                Season: {player.seasonMode === "IN_SEASON" ? "In season" : "Off season"}
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Latest notes</h2>
        <div className="mt-4 space-y-3">
          {latestNotes.map((note, index) => (
            <Link
              key={`${note.enrollmentId}-${note.programDay}-${index}`}
              href={`/admin/program/${note.enrollmentId}`}
              className="block rounded-xl border border-[#2b3650] bg-black/20 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-100">{note.playerName}</p>
                <p className="text-xs text-zinc-500">{note.relativeTime}</p>
              </div>
              <p className="mt-1 text-xs text-[#52B788]">
                Day {note.programDay} . {note.taskTitle}
              </p>
              <p className="mt-2 text-sm text-zinc-300">{note.note}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
