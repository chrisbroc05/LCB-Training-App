import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminQuizPanel from "@/app/admin/leads/AdminQuizPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { loadQuizAdminDashboard } from "@/lib/player-iq-quiz-admin-server";

export default async function AdminContentQuizPage() {
  const quizDashboard = await loadQuizAdminDashboard();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Player IQ Quiz"
        description="Every attempt, averages, level distribution, and per-question accuracy."
        backHref={ADMIN_ROUTES.content.hub}
        backLabel="Content"
      />
      <section className="admin-page-section">
        <AdminQuizPanel {...quizDashboard} />
      </section>
    </div>
  );
}
