"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  adminFetchJson,
  ADMIN_FETCH_COULD_NOT_LOAD_JSON,
} from "@/lib/admin-fetch-shared";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import {
  DAILY_CHALLENGE_AGE_GROUPS,
  dailyChallengeAgeGroupLabel,
  type DailyChallengeAgeGroupKey,
} from "@/lib/daily-challenge-shared";

type ChallengeRow = {
  id: string;
  ageGroup: DailyChallengeAgeGroupKey;
  rotationDay: number;
  title: string;
  instructions: string;
  drillLibraryVimeoId: string | null;
  active: boolean;
};

type QuestionRow = {
  id: string;
  ageGroup: DailyChallengeAgeGroupKey | null;
  rotationDay: number;
  type: "TRIVIA" | "MINDSET";
  prompt: string;
  options: string[];
  correctOptionIndex: number | null;
  explanation: string | null;
  active: boolean;
};

type Settings = {
  pushHourChicago: number;
  pushMinuteChicago: number;
};

type PreviewRow = {
  ageGroup: DailyChallengeAgeGroupKey;
  ageGroupLabel: string;
  challenge: { title: string; instructions: string; rotationDay: number } | null;
  question: {
    type: string;
    prompt: string;
    options: string[];
    rotationDay: number;
  } | null;
};

const emptyChallenge = {
  id: "",
  ageGroup: "AGE_8_11" as DailyChallengeAgeGroupKey,
  rotationDay: 1,
  title: "",
  instructions: "",
  drillLibraryVimeoId: "",
  active: true,
};

const emptyQuestion = {
  id: "",
  ageGroup: "AGE_8_11" as DailyChallengeAgeGroupKey | "all",
  rotationDay: 1,
  type: "TRIVIA" as "TRIVIA" | "MINDSET",
  prompt: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  explanation: "",
  active: true,
};

export default function AdminDailyChallengesPanel() {
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [settings, setSettings] = useState<Settings>({
    pushHourChicago: 15,
    pushMinuteChicago: 30,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [challengeDraft, setChallengeDraft] = useState(emptyChallenge);
  const [questionDraft, setQuestionDraft] = useState(emptyQuestion);
  const [previewDate, setPreviewDate] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetchJson<{
      challenges?: ChallengeRow[];
      questions?: QuestionRow[];
      settings?: Settings;
      error?: string;
    }>("/api/admin/daily-challenges", { cache: "no-store" }, {
      context: "daily-challenges-list",
      okUserMessage: "Couldn't load daily challenges.",
      notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
    });
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    setChallenges(res.data.challenges ?? []);
    setQuestions(res.data.questions ?? []);
    if (res.data.settings) {
      setSettings(res.data.settings);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveChallenge = async () => {
    setBusy(true);
    setError(null);
    const res = await adminFetchJson<{ error?: string }>(
      "/api/admin/daily-challenges/challenges",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: challengeDraft.id || undefined,
          ageGroup: challengeDraft.ageGroup,
          rotationDay: Number(challengeDraft.rotationDay),
          title: challengeDraft.title,
          instructions: challengeDraft.instructions,
          drillLibraryVimeoId: challengeDraft.drillLibraryVimeoId || null,
          active: challengeDraft.active,
        }),
      },
      {
        context: "daily-challenge-save",
        okUserMessage: "Couldn't save challenge.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    setChallengeDraft(emptyChallenge);
    await load();
  };

  const saveQuestion = async () => {
    setBusy(true);
    setError(null);
    const options = questionDraft.options.map((option) => option.trim()).filter(Boolean);
    const res = await adminFetchJson<{ error?: string }>(
      "/api/admin/daily-challenges/questions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: questionDraft.id || undefined,
          ageGroup: questionDraft.ageGroup === "all" ? null : questionDraft.ageGroup,
          rotationDay: Number(questionDraft.rotationDay),
          type: questionDraft.type,
          prompt: questionDraft.prompt,
          options,
          correctOptionIndex:
            questionDraft.type === "TRIVIA" ? questionDraft.correctOptionIndex : null,
          explanation: questionDraft.explanation || null,
          active: questionDraft.active,
        }),
      },
      {
        context: "daily-question-save",
        okUserMessage: "Couldn't save question.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    setQuestionDraft(emptyQuestion);
    await load();
  };

  const saveSettings = async () => {
    setBusy(true);
    setError(null);
    const res = await adminFetchJson<{ error?: string }>(
      "/api/admin/daily-challenges/settings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      },
      {
        context: "daily-challenge-settings",
        okUserMessage: "Couldn't save settings.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.userMessage);
    }
  };

  const runPreview = async () => {
    if (!previewDate) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await adminFetchJson<{
      preview?: { rows: PreviewRow[] };
      error?: string;
    }>(
      `/api/admin/daily-challenges/preview?date=${encodeURIComponent(previewDate)}`,
      { cache: "no-store" },
      {
        context: "daily-challenge-preview",
        okUserMessage: "Couldn't preview date.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.userMessage);
      return;
    }
    setPreviewRows(res.data.preview?.rows ?? []);
  };

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">Tools</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={ADMIN_ROUTES.content.dailyChallengeImport}
              className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200"
            >
              CSV import
            </Link>
            <Link
              href={ADMIN_ROUTES.content.dailyChallengeAnswers}
              className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200"
            >
              Mindset answers
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-zinc-300">
            Push hour (Chicago)
            <input
              type="number"
              min={0}
              max={23}
              value={settings.pushHourChicago}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  pushHourChicago: Number(event.target.value),
                }))
              }
              className="mt-1 block w-24 rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-300">
            Minute
            <input
              type="number"
              min={0}
              max={59}
              value={settings.pushMinuteChicago}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  pushMinuteChicago: Number(event.target.value),
                }))
              }
              className="mt-1 block w-24 rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveSettings()}
            className="rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#0A1628]"
          >
            Save push time
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Hourly cron sends when the Chicago hour matches. Default 3:30pm.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-zinc-300">
            Preview date
            <input
              type="date"
              value={previewDate}
              onChange={(event) => setPreviewDate(event.target.value)}
              className="mt-1 block rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={busy || !previewDate}
            onClick={() => void runPreview()}
            className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200"
          >
            Preview
          </button>
        </div>
        {previewRows ? (
          <div className="mt-4 space-y-3">
            {previewRows.map((row) => (
              <div key={row.ageGroup} className="rounded-xl border border-[#1c2740] p-3 text-sm">
                <p className="font-semibold text-zinc-100">{row.ageGroupLabel}</p>
                <p className="mt-1 text-zinc-300">
                  Challenge:{" "}
                  {row.challenge
                    ? `${row.challenge.title} (day ${row.challenge.rotationDay})`
                    : "None"}
                </p>
                <p className="mt-1 text-zinc-300">
                  Question:{" "}
                  {row.question
                    ? `${row.question.type} - ${row.question.prompt} (day ${row.question.rotationDay})`
                    : "None"}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">
          {challengeDraft.id ? "Edit challenge" : "Add challenge"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-300">
            Age group
            <select
              value={challengeDraft.ageGroup}
              onChange={(event) =>
                setChallengeDraft((prev) => ({
                  ...prev,
                  ageGroup: event.target.value as DailyChallengeAgeGroupKey,
                }))
              }
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            >
              {DAILY_CHALLENGE_AGE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {dailyChallengeAgeGroupLabel(group)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Rotation day
            <input
              type="number"
              min={1}
              value={challengeDraft.rotationDay}
              onChange={(event) =>
                setChallengeDraft((prev) => ({
                  ...prev,
                  rotationDay: Number(event.target.value),
                }))
              }
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            />
          </label>
          <label className="text-sm text-zinc-300 sm:col-span-2">
            Title
            <input
              value={challengeDraft.title}
              onChange={(event) =>
                setChallengeDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            />
          </label>
          <label className="text-sm text-zinc-300 sm:col-span-2">
            Instructions
            <textarea
              value={challengeDraft.instructions}
              onChange={(event) =>
                setChallengeDraft((prev) => ({ ...prev, instructions: event.target.value }))
              }
              rows={3}
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            />
          </label>
          <label className="text-sm text-zinc-300 sm:col-span-2">
            Drill library Vimeo id (optional)
            <input
              value={challengeDraft.drillLibraryVimeoId}
              onChange={(event) =>
                setChallengeDraft((prev) => ({
                  ...prev,
                  drillLibraryVimeoId: event.target.value,
                }))
              }
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveChallenge()}
            className="rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#0A1628]"
          >
            Save challenge
          </button>
          {challengeDraft.id ? (
            <button
              type="button"
              onClick={() => setChallengeDraft(emptyChallenge)}
              className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2">Age</th>
                <th className="px-2 py-2">Day</th>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Active</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {challenges.map((row) => (
                <tr key={row.id} className="border-t border-[#1c2740]">
                  <td className="px-2 py-2">{dailyChallengeAgeGroupLabel(row.ageGroup)}</td>
                  <td className="px-2 py-2">{row.rotationDay}</td>
                  <td className="px-2 py-2 text-zinc-100">{row.title}</td>
                  <td className="px-2 py-2">{row.active ? "Yes" : "No"}</td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="text-[#52B788]"
                      onClick={() =>
                        setChallengeDraft({
                          id: row.id,
                          ageGroup: row.ageGroup,
                          rotationDay: row.rotationDay,
                          title: row.title,
                          instructions: row.instructions,
                          drillLibraryVimeoId: row.drillLibraryVimeoId ?? "",
                          active: row.active,
                        })
                      }
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">
          {questionDraft.id ? "Edit question" : "Add question"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-300">
            Type
            <select
              value={questionDraft.type}
              onChange={(event) =>
                setQuestionDraft((prev) => ({
                  ...prev,
                  type: event.target.value as "TRIVIA" | "MINDSET",
                }))
              }
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            >
              <option value="TRIVIA">Trivia</option>
              <option value="MINDSET">Mindset</option>
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Age group
            <select
              value={questionDraft.ageGroup}
              onChange={(event) =>
                setQuestionDraft((prev) => ({
                  ...prev,
                  ageGroup: event.target.value as DailyChallengeAgeGroupKey | "all",
                }))
              }
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            >
              <option value="all">All</option>
              {DAILY_CHALLENGE_AGE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {dailyChallengeAgeGroupLabel(group)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Rotation day
            <input
              type="number"
              min={1}
              value={questionDraft.rotationDay}
              onChange={(event) =>
                setQuestionDraft((prev) => ({
                  ...prev,
                  rotationDay: Number(event.target.value),
                }))
              }
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            />
          </label>
          <label className="text-sm text-zinc-300 sm:col-span-2">
            Prompt
            <textarea
              value={questionDraft.prompt}
              onChange={(event) =>
                setQuestionDraft((prev) => ({ ...prev, prompt: event.target.value }))
              }
              rows={2}
              className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
            />
          </label>
          {questionDraft.type === "TRIVIA" ? (
            <>
              {[0, 1, 2, 3].map((index) => (
                <label key={index} className="text-sm text-zinc-300">
                  Option {index + 1}
                  <input
                    value={questionDraft.options[index] ?? ""}
                    onChange={(event) =>
                      setQuestionDraft((prev) => {
                        const options = [...prev.options];
                        options[index] = event.target.value;
                        return { ...prev, options };
                      })
                    }
                    className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
                  />
                </label>
              ))}
              <label className="text-sm text-zinc-300">
                Correct option
                <select
                  value={questionDraft.correctOptionIndex}
                  onChange={(event) =>
                    setQuestionDraft((prev) => ({
                      ...prev,
                      correctOptionIndex: Number(event.target.value),
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <option key={index} value={index}>
                      Option {index + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-zinc-300 sm:col-span-2">
                Explanation
                <textarea
                  value={questionDraft.explanation}
                  onChange={(event) =>
                    setQuestionDraft((prev) => ({
                      ...prev,
                      explanation: event.target.value,
                    }))
                  }
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-[#2b3650] bg-[#0A1628] px-3 py-2"
                />
              </label>
            </>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveQuestion()}
            className="rounded-full bg-[#52B788] px-4 py-2 text-sm font-semibold text-[#0A1628]"
          >
            Save question
          </button>
          {questionDraft.id ? (
            <button
              type="button"
              onClick={() => setQuestionDraft(emptyQuestion)}
              className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Age</th>
                <th className="px-2 py-2">Day</th>
                <th className="px-2 py-2">Prompt</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {questions.map((row) => (
                <tr key={row.id} className="border-t border-[#1c2740]">
                  <td className="px-2 py-2">{row.type}</td>
                  <td className="px-2 py-2">
                    {row.ageGroup ? dailyChallengeAgeGroupLabel(row.ageGroup) : "All"}
                  </td>
                  <td className="px-2 py-2">{row.rotationDay}</td>
                  <td className="px-2 py-2 text-zinc-100">{row.prompt}</td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="text-[#52B788]"
                      onClick={() =>
                        setQuestionDraft({
                          id: row.id,
                          ageGroup: row.ageGroup ?? "all",
                          rotationDay: row.rotationDay,
                          type: row.type,
                          prompt: row.prompt,
                          options: [
                            row.options[0] ?? "",
                            row.options[1] ?? "",
                            row.options[2] ?? "",
                            row.options[3] ?? "",
                          ],
                          correctOptionIndex: row.correctOptionIndex ?? 0,
                          explanation: row.explanation ?? "",
                          active: row.active,
                        })
                      }
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
