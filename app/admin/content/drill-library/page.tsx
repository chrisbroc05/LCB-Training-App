import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminDrillLibraryPanel from "@/app/admin/content/drill-library/AdminDrillLibraryPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminContentDrillLibraryPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Drill library"
        description="Playbook starter drill toggles on the public catalog."
        backHref={ADMIN_ROUTES.content.hub}
        backLabel="Content"
      />
      <AdminDrillLibraryPanel />
    </div>
  );
}
