import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminDailyChallengesPanel from "@/app/admin/content/daily-challenges/AdminDailyChallengesPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminDailyChallengesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Daily Challenges"
        description="Bodyweight challenges and trivia/mindset questions by age group, with Chicago date rotation."
        backHref={ADMIN_ROUTES.content.hub}
        backLabel="Content"
      />
      <AdminDailyChallengesPanel />
    </div>
  );
}
