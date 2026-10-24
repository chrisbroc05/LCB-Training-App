import AdminFreeSwingResponseSetting from "@/app/admin/AdminFreeSwingResponseSetting";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminSettingsCoachingPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coaching settings"
        description="Free swing analysis response routing."
        backHref={ADMIN_ROUTES.settings.hub}
        backLabel="Settings"
      />
      <AdminFreeSwingResponseSetting />
    </div>
  );
}
