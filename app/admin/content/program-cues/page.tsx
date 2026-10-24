import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminProgramCuesPanel from "@/app/admin/program/cues/AdminProgramCuesPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminContentProgramCuesPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Program hitting focuses"
        description="My Hitting Focuses library for the 12-week program."
        backHref={ADMIN_ROUTES.content.hub}
        backLabel="Content"
      />
      <AdminProgramCuesPanel />
    </div>
  );
}
