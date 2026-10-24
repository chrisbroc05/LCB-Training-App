import Link from "next/link";
import { notFound } from "next/navigation";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { loadQuizAttemptAdminDetail } from "@/lib/player-iq-quiz-admin-server";

type PageProps = { params: Promise<{ attemptId: string }> };

export default async function AdminQuizAttemptDetailPage({ params }: PageProps) {
  const { attemptId } = await params;
  const attempt = await loadQuizAttemptAdminDetail(attemptId);
  if (!attempt) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${attempt.name} - Player IQ Quiz`}
        description={`${attempt.email} | ${attempt.role} | ${new Date(attempt.completedAt).toLocaleString()}`}
        backHref={ADMIN_ROUTES.content.quiz}
        backLabel="Player IQ Quiz"
      />

      <section className="admin-page-section grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-zinc-500">Score</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{attempt.score ?? "-"} / 15</p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Level</p>
          <p className="mt-1 text-lg font-semibold text-[#9df3bd]">{attempt.level ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Categories</p>
          <p className="mt-1 text-sm text-zinc-200">
            Mindset {attempt.mindset ?? "-"} | Game IQ {attempt.gameIq ?? "-"} | Training{" "}
            {attempt.training ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">Lead</p>
          {attempt.leadHref ? (
            <Link href={attempt.leadHref} className="mt-1 inline-flex text-sm font-semibold text-[#52B788]">
              View lead profile
            </Link>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">No lead record</p>
          )}
        </div>
      </section>

      <section className="admin-page-section space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Full answers</h2>
        <ul className="space-y-3">
          {attempt.answerRows.map((row) => (
            <li
              key={row.order}
              className={`rounded-xl border p-3 ${
                row.isCorrect
                  ? "border-[#22c55e]/30 bg-[#22c55e]/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <p className="text-xs font-semibold text-zinc-500">Question {row.order}</p>
              <p className="mt-1 text-sm text-zinc-100">{row.prompt}</p>
              <p className="mt-2 text-sm text-zinc-300">
                Their answer: <span className="text-zinc-100">{row.selectedLabel}</span>
              </p>
              {!row.isCorrect ? (
                <p className="mt-1 text-sm text-[#9df3bd]">Correct: {row.correctLabel}</p>
              ) : null}
              <p className="mt-2 text-xs text-zinc-500">{row.why}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
