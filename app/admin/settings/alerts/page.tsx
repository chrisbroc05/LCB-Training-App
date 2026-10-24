import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminProgramCoachAlerts from "@/app/admin/program/AdminProgramCoachAlerts";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminSettingsAlertsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coach alerts"
        description="Push notification tests and subscription info."
        backHref={ADMIN_ROUTES.settings.hub}
        backLabel="Settings"
      />
      <AdminProgramCoachAlerts />
    </div>
  );
}
