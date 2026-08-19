"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GoalTrackerList from "@/app/goal-setting/GoalTrackerList";
import ProfileCard from "@/app/profile/ProfileCard";
import {
  profileMutedTextClass,
  profilePrimaryButtonClass,
} from "@/app/profile/profile-styles";
import type { SerializedGoalItem } from "@/lib/goal-check-in-constants";

type GoalHistoryEntry = {
  id: number;
  createdAt: string;
  monthlyFocus: string;
  lastMonthReview: string;
  focusArea: string;
  focusAreaLabel: string;
  additionalNotes: string | null;
  coachResponse: string | null;
  status: string;
  respondedAt: string | null;
  goals: SerializedGoalItem[];
};

type ProfileGoalCheckinHistoryProps = {
  hasAccess: boolean;
};

function formatMonthYear(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatResponseDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  const isPending = status === "pending";

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        isPending
          ? "bg-yellow-500/20 text-yellow-100"
          : "bg-[#22c55e]/20 text-[#9df3bd]"
      }`}
    >
      {isPending ? "Pending" : "Responded"}
    </span>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-zinc-400 transition-transform duration-300 ${
        expanded ? "rotate-180" : "rotate-0"
      }`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfileGoalCheckinHistory({ hasAccess }: ProfileGoalCheckinHistoryProps) {
  const [entries, setEntries] = useState<GoalHistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(hasAccess);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!hasAccess) {
      return;
    }

    const loadHistory = async () => {
      setIsLoading(true);
      setLoadError("");

      const response = await fetch("/api/goal-checkin/history");
      setIsLoading(false);

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setLoadError(data.error ?? "Unable to load goal check-in history right now.");
        setEntries([]);
        return;
      }

      const data = (await response.json()) as { entries?: GoalHistoryEntry[] };
      const nextEntries = data.entries ?? [];
      setEntries(nextEntries);
      setExpandedId(nextEntries[0]?.id ?? null);
    };

    void loadHistory();
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <ProfileCard title="Goal Check-In History">
        <p className={profileMutedTextClass}>
          Goal check-ins are available on Memorable and Elite memberships.
        </p>
      </ProfileCard>
    );
  }

  if (isLoading) {
    return (
      <ProfileCard title="Goal Check-In History">
        <p className={profileMutedTextClass}>Loading goal check-in history...</p>
      </ProfileCard>
    );
  }

  if (loadError) {
    return (
      <ProfileCard title="Goal Check-In History">
        <p className="text-sm text-red-300">{loadError}</p>
      </ProfileCard>
    );
  }

  if (entries.length === 0) {
    return (
      <ProfileCard title="Goal Check-In History">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <p className={profileMutedTextClass}>
            No goal check-ins yet. Head to the Goal Check-In page to set your first monthly goals.
          </p>
          <Link href="/goal-setting" className={profilePrimaryButtonClass}>
            Set My Goals
          </Link>
        </div>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard
      title="Goal Check-In History"
      description="Review your past monthly goal check-ins and Coach Broc's responses."
    >
      <div className="space-y-3">
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id;

          return (
            <article
              key={entry.id}
              className={`overflow-hidden rounded-xl border transition-colors duration-300 ${
                isExpanded
                  ? "border-[#22c55e]/60 bg-[#22c55e]/10"
                  : "border-[#2b3650] bg-black/30 hover:border-[#3c4a68]"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
                aria-expanded={isExpanded}
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {formatMonthYear(entry.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{entry.focusAreaLabel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={entry.status} />
                  <ChevronIcon expanded={isExpanded} />
                </div>
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="border-t border-[#2b3650]/80 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                    <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
                      <p className="text-sm font-semibold text-zinc-100">Your Submission</p>
                      <div className="mt-3 space-y-3 text-sm text-zinc-300">
                        <div>
                          <p className="font-semibold text-zinc-100">
                            What is your main focus and goal this month?
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{entry.monthlyFocus}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-100">
                            What did you work on last month and how did it go?
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{entry.lastMonthReview}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-100">
                            What area do you most want to improve?
                          </p>
                          <p className="mt-1">{entry.focusAreaLabel}</p>
                        </div>
                        {entry.additionalNotes ? (
                          <div>
                            <p className="font-semibold text-zinc-100">
                              Is there anything specific you want Coach Broc to know or focus on this
                              month?
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">{entry.additionalNotes}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {entry.goals.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-zinc-100">Monthly Goal Tracker</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Past month goals are shown read-only.
                        </p>
                        <div className="mt-3">
                          <GoalTrackerList goals={entry.goals} interactive={false} />
                        </div>
                      </div>
                    ) : null}

                    {entry.coachResponse ? (
                      <div className="mt-4 rounded-xl border border-[#2b3650] border-l-4 border-l-[#52B788] bg-[#0f1d34] p-4">
                        <p className="text-sm font-semibold text-[#9df3bd]">
                          Coach Broc&apos;s Response
                        </p>
                        {entry.respondedAt ? (
                          <p className="mt-1 text-xs text-zinc-400">
                            Responded {formatResponseDate(entry.respondedAt)}
                          </p>
                        ) : null}
                        <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-100">
                          {entry.coachResponse}
                        </p>
                      </div>
                    ) : entry.status === "pending" ? (
                      <p className="mt-4 text-sm text-zinc-400">
                        Coach Broc is reviewing your goals and will respond within 48 hours.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </ProfileCard>
  );
}
