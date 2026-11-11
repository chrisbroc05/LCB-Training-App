import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminDailyChallengeCsvImportPanel from "@/app/admin/content/daily-challenges/AdminDailyChallengeCsvImportPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminDailyChallengeImportPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Import Daily Challenges CSV"
        description="Preview first. Nothing is saved until you confirm."
        backHref={ADMIN_ROUTES.content.dailyChallenges}
        backLabel="Daily Challenges"
      />
      <AdminDailyChallengeCsvImportPanel />
    </div>
  );
}
