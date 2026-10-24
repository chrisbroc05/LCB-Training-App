import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminReportsPanel from "@/app/admin/reports/AdminReportsPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminCoachingReportsPage() {
  return (
    <section className="admin-page-section">
      <AdminPageHeader
        title="Written reports"
        description="Quick written evaluations for Core, org trial, and free swing submissions."
        backHref={ADMIN_ROUTES.coaching.hub}
        backLabel="Coaching"
      />
      <AdminReportsPanel />
    </section>
  );
}
