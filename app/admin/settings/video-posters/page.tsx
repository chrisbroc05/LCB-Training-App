import AdminGenerateVideoPostersPanel from "@/app/admin/AdminGenerateVideoPostersPanel";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminSettingsVideoPostersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Video posters"
        description="Batch-generate JPEG posters for older R2 videos."
        backHref={ADMIN_ROUTES.settings.hub}
        backLabel="Settings"
      />
      <AdminGenerateVideoPostersPanel />
    </div>
  );
}
