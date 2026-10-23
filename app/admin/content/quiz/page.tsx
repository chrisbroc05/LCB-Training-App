import AdminQuizPanel from "@/app/admin/leads/AdminQuizPanel";
import { loadQuizAdminDashboard } from "@/lib/player-iq-quiz-admin-server";

export default async function AdminContentQuizPage() {
  const quizDashboard = await loadQuizAdminDashboard();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Player IQ Quiz</h1>
        <p className="mt-2 text-sm text-zinc-400">Completion stats and question performance.</p>
      </header>
      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <AdminQuizPanel {...quizDashboard} />
      </section>
    </div>
  );
}
