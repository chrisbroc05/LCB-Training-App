"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import DailyLeaderboardNotice from "@/app/dashboard/DailyLeaderboardNotice";
import {
  dailyChallengeAgeGroupLabel,
  formatDailyChallengeDayDoneMessage,
  formatDailyLeaderboardEntryPrimary,
  formatDailyLeaderboardStats,
  isDailyChallengeQuestionAnswered,
  MINDSET_ANSWER_MAX_CHARS,
  type DailyChallengeAgeGroupKey,
  type DailyChallengeContentPayload,
  type DailyLeaderboardPayload,
} from "@/lib/daily-challenge-shared";

type DailyChallengeCardProps = {
  variant?: "primary" | "bonus";
};

type ApiPayload = {
  content?: DailyChallengeContentPayload;
  leaderboard?: DailyLeaderboardPayload | null;
  error?: string;
};

export default function DailyChallengeCard({ variant = "primary" }: DailyChallengeCardProps) {
  const [content, setContent] = useState<DailyChallengeContentPayload | null>(null);
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ageDraft, setAgeDraft] = useState("");
  const [mindsetDraft, setMindsetDraft] = useState("");

  const applyPayload = useCallback((data: ApiPayload) => {
    if (data.content) {
      setContent(data.content);
      if (data.content.completion.mindsetAnswer) {
        setMindsetDraft(data.content.completion.mindsetAnswer);
      }
    }
    if (data.leaderboard !== undefined) {
      setLeaderboard(data.leaderboard);
    }
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/daily-challenge", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as ApiPayload;
    if (!response.ok) {
      setError(data.error ?? "Couldn't load today's challenge.");
      return;
    }
    applyPayload(data);
  }, [applyPayload]);

  useEffect(() => {
    void load();
  }, [load]);

  const postJson = async (url: string, body?: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json().catch(() => ({}))) as ApiPayload & {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      applyPayload(data);
    } finally {
      setBusy(false);
    }
  };

  if (!content && !error) {
    return (
      <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-5">
        <p className="text-sm text-zinc-400">Loading daily challenge...</p>
      </article>
    );
  }

  if (!content) {
    return null;
  }

  const ageLabel = content.ageGroup
    ? dailyChallengeAgeGroupLabel(content.ageGroup as DailyChallengeAgeGroupKey)
    : null;

  return (
    <article
      className={`rounded-2xl border p-4 sm:p-5 ${
        variant === "bonus"
          ? "border-zinc-600/60 bg-[#0b1324]/60"
          : "border-[#52B788]/40 bg-[#22c55e]/5"
      }`}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
            {variant === "bonus" ? "Bonus: Daily Challenge" : "Daily Challenge"}
            {variant === "primary" && ageLabel ? ` - ${ageLabel}` : ""}
          </p>
          <p className="text-xs font-semibold text-zinc-300">
            Streak {content.streak} day{content.streak === 1 ? "" : "s"}
          </p>
        </div>
        {variant === "bonus" ? (
          <p className="text-xs text-zinc-500">
            Not part of your daily plan{ageLabel ? ` | Ages ${ageLabel}` : ""}
          </p>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}

      {content.needsAge ? (
        <div className="mt-3 space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">How old is the player?</h2>
          <p className="text-sm text-zinc-400">
            We ask once so everyone gets the right challenge for their age group.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={5}
              max={25}
              value={ageDraft}
              onChange={(event) => setAgeDraft(event.target.value)}
              className="w-24 rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm text-zinc-100"
              placeholder="Age"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void postJson("/api/daily-challenge/age", { age: Number(ageDraft) })}
              className="rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#0A1628]"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          {content.challenge ? (
            <div className="mt-3">
              <h2 className="text-lg font-semibold text-zinc-100">{content.challenge.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                {content.challenge.instructions}
              </p>
              {content.challenge.drillLibraryVimeoId ? (
                <Link
                  href={`/drill-library?v=${encodeURIComponent(content.challenge.drillLibraryVimeoId)}`}
                  className="mt-2 inline-block text-sm font-semibold text-[#52B788]"
                >
                  Open related drill
                </Link>
              ) : null}
              <div className="mt-4">
                {content.completion.challengeDone ? (
                  <p className="text-sm font-semibold text-[#9df3bd]">Done for today</p>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void postJson("/api/daily-challenge/done")}
                    className="rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#0A1628]"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">No challenge posted for today yet.</p>
          )}

          {content.question ? (
            <div className="mt-5 border-t border-[#18243a] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {content.question.type === "MINDSET" ? "Mindset" : "Trivia"}
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-100">{content.question.prompt}</p>

              {content.question.type === "TRIVIA" ? (
                <div className="mt-3 space-y-2">
                  {content.question.options.map((option, index) => {
                    const selected = content.completion.triviaSelectedIndex === index;
                    const answered = content.completion.triviaSelectedIndex !== null;
                    const correctIndex = content.question?.correctOptionIndex;
                    const showCorrect =
                      answered && correctIndex !== null && correctIndex === index;
                    const showWrong =
                      answered &&
                      selected &&
                      content.completion.triviaCorrect === false;
                    return (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        disabled={busy || answered}
                        onClick={() =>
                          void postJson("/api/daily-challenge/trivia", { selectedIndex: index })
                        }
                        className={`block w-full rounded-xl border px-3 py-2 text-left text-sm ${
                          showCorrect
                            ? "border-[#52B788] bg-[#22c55e]/15 text-[#9df3bd]"
                            : showWrong
                              ? "border-red-400/60 bg-red-500/10 text-red-100"
                              : "border-[#2b3650] text-zinc-200"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                  {content.completion.triviaSelectedIndex !== null ? (
                    <p className="text-sm text-zinc-300">
                      {content.completion.triviaCorrect ? "Nice!" : "Not quite."}
                      {content.question.explanation
                        ? ` ${content.question.explanation}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-zinc-500">Coach Broc reads these.</p>
                  <textarea
                    value={mindsetDraft}
                    maxLength={MINDSET_ANSWER_MAX_CHARS}
                    disabled={busy || Boolean(content.completion.mindsetAnswer)}
                    onChange={(event) => setMindsetDraft(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm text-zinc-100"
                    placeholder="Write a short answer..."
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-zinc-500">
                      {mindsetDraft.length}/{MINDSET_ANSWER_MAX_CHARS}
                    </p>
                    {content.completion.mindsetAnswer ? (
                      <p className="text-sm font-semibold text-[#9df3bd]">Saved</p>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || !mindsetDraft.trim()}
                        onClick={() =>
                          void postJson("/api/daily-challenge/mindset", { answer: mindsetDraft })
                        }
                        className="rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#0A1628]"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {content.challenge &&
          content.question &&
          content.completion.challengeDone &&
          isDailyChallengeQuestionAnswered(content.completion, content.question.type) ? (
            <p className="mt-5 border-t border-[#18243a] pt-4 text-sm font-medium text-[#9df3bd]">
              {formatDailyChallengeDayDoneMessage(content.streak)}
            </p>
          ) : null}

          {leaderboard ? (
            <div className="mt-5 border-t border-[#18243a] pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  LCB Leaderboard
                </p>
                <Link
                  href="/dashboard/leaderboard"
                  className="text-xs font-semibold text-[#52B788]"
                >
                  See full leaderboard
                </Link>
              </div>
              {leaderboard.top.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-400">
                  Be the first on the board this month.
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {leaderboard.top.map((entry) => (
                    <li
                      key={entry.userId}
                      className={`flex items-center justify-between gap-2 text-sm ${
                        entry.isSelf ? "font-semibold text-[#9df3bd]" : "text-zinc-300"
                      }`}
                    >
                      <span>
                        #{entry.rank} {formatDailyLeaderboardEntryPrimary(entry)}
                      </span>
                      <span className="shrink-0">
                        {formatDailyLeaderboardStats(
                          entry.completedThisMonth,
                          entry.streak,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {leaderboard.self ? (
                <p className="mt-2 text-sm font-semibold text-[#9df3bd]">
                  You&apos;re #{leaderboard.self.rank}
                </p>
              ) : null}
              <DailyLeaderboardNotice notice={leaderboard.viewerNotice} />
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
