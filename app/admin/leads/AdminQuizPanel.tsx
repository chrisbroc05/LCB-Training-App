"use client";

import { useMemo } from "react";

type QuizRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  score: number | null;
  level: string | null;
  mindset: number | null;
  gameIq: number | null;
  training: number | null;
  completedAt: string | null;
};

type QuestionStat = {
  order: number;
  prompt: string;
  difficulty: string;
  percentCorrect: number;
  answered: number;
};

type AdminQuizPanelProps = {
  rows: QuizRow[];
  totalCompleted: number;
  averageScore: number;
  levelCounts: Record<string, number>;
  questionStats: QuestionStat[];
};

export default function AdminQuizPanel({
  rows,
  totalCompleted,
  averageScore,
  levelCounts,
  questionStats,
}: AdminQuizPanelProps) {
  const completedRows = useMemo(
    () => rows.filter((row) => row.completedAt),
    [rows],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Player IQ Quiz</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {totalCompleted} completed · average score {averageScore}
          </p>
        </div>
        <a
          href="/api/admin/quiz/export"
          className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-[#9df3bd] hover:border-[#52B788]/50"
        >
          Export CSV
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(levelCounts).map(([level, count]) => (
          <div
            key={level}
            className="rounded-xl border border-[#18243a] bg-[#0b1324] px-4 py-3 text-sm"
          >
            <p className="font-semibold text-zinc-200">{level.replace(/_/g, "-")}</p>
            <p className="mt-1 text-2xl font-bold text-[#52B788]">{count}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-400">
          Per-question accuracy
        </h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#18243a]">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#0b1324] text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Q</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">% correct</th>
                <th className="px-4 py-3">Prompt</th>
              </tr>
            </thead>
            <tbody>
              {questionStats.map((stat) => (
                <tr key={stat.order} className="border-t border-[#18243a]">
                  <td className="px-4 py-3">{stat.order}</td>
                  <td className="px-4 py-3">{stat.difficulty}</td>
                  <td className="px-4 py-3">{stat.percentCorrect}% ({stat.answered})</td>
                  <td className="max-w-md px-4 py-3 text-zinc-400">{stat.prompt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Recent attempts</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#18243a]">
          <table className="min-w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#0b1324] text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Categories</th>
              </tr>
            </thead>
            <tbody>
              {completedRows.map((row) => (
                <tr key={row.id} className="border-t border-[#18243a]">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {row.completedAt ? new Date(row.completedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">{row.score ?? "-"}</td>
                  <td className="px-4 py-3">{row.level ?? "-"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    M {row.mindset ?? "-"} / G {row.gameIq ?? "-"} / T {row.training ?? "-"}
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
