"use client";

import { useEffect, useState } from "react";
import ProfileCard from "@/app/profile/ProfileCard";
import { profileBodyTextClass, profileMutedTextClass } from "@/app/profile/profile-styles";

type GoalHistoryEntry = {
  id: number;
  createdAt: string;
  monthlyFocus: string;
  focusAreaLabel: string;
  coachResponse: string | null;
  status: string;
  respondedAt: string | null;
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
      const response = await fetch("/api/goal-checkin/history");
      setIsLoading(false);

      if (!response.ok) {
        setLoadError("Unable to load goal check-in history right now.");
        return;
      }

      const data = (await response.json()) as { entries?: GoalHistoryEntry[] };
      setEntries(data.entries ?? []);
      setExpandedId(data.entries?.[0]?.id ?? null);
    };

    void loadHistory();
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <ProfileCard title="Goal Check-In History">
        <p className={profileBodyTextClass}>
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
        <p className={profileMutedTextClass}>No goal check-ins yet.</p>
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
          const isPending = entry.status === "pending";

          return (
            <article
              key={entry.id}
              className={`overflow-hidden rounded-xl border transition ${
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
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      isPending ? "bg-[#24314a] text-zinc-200" : "bg-[#22c55e]/20 text-[#9df3bd]"
                    }`}
                  >
                    {isPending ? "Pending" : "Responded"}
                  </span>
                  <span className="text-sm text-zinc-400">{isExpanded ? "-" : "+"}</span>
                </div>
              </button>

              {isExpanded ? (
                <div className="border-t border-[#2b3650]/80 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                  <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
                    <p className="text-sm font-semibold text-zinc-100">Monthly Focus</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                      {entry.monthlyFocus}
                    </p>
                  </div>

                  {entry.coachResponse ? (
                    <div className="mt-4 rounded-xl border border-[#2b3650] border-l-4 border-l-[#52B788] bg-[#0f1d34] p-4">
                      <p className="text-sm font-semibold text-[#9df3bd]">Coach Broc&apos;s Response</p>
                      {entry.respondedAt ? (
                        <p className="mt-1 text-xs text-zinc-400">
                          Responded {formatResponseDate(entry.respondedAt)}
                        </p>
                      ) : null}
                      <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-100">
                        {entry.coachResponse}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-zinc-400">
                      Coach Broc is reviewing your goals and will respond within 48 hours.
                    </p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </ProfileCard>
  );
}
