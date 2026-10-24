import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminProgramEmailToolsSection from "@/app/admin/settings/program-email/AdminProgramEmailToolsSection";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminSettingsProgramEmailPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Program email tools"
        description="Utilities for program-related email sends."
        backHref={ADMIN_ROUTES.settings.hub}
        backLabel="Settings"
      />
      <AdminProgramEmailToolsSection />
    </div>
  );
}
