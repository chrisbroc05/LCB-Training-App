import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminResourceStatsPanel from "@/app/admin/content/resources/AdminResourceStatsPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminContentResourcesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Resources stats"
        description="Funnel metrics for every card on the public /resources page (Chicago dates)."
        backHref={ADMIN_ROUTES.content.hub}
        backLabel="Content"
      />
      <section className="admin-page-section">
        <AdminResourceStatsPanel />
      </section>
    </div>
  );
}
