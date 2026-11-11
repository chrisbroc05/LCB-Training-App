import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminDailyChallengeAnswersPanel from "@/app/admin/content/daily-challenges/AdminDailyChallengeAnswersPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminDailyChallengeAnswersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Mindset answers"
        description="Sunday mindset responses by date, with org/team/age filters."
        backHref={ADMIN_ROUTES.content.dailyChallenges}
        backLabel="Daily Challenges"
      />
      <AdminDailyChallengeAnswersPanel />
    </div>
  );
}
