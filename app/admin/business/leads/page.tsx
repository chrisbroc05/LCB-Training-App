import AdminLegacyLeadInvitePanel from "@/app/admin/business/leads/AdminLegacyLeadInvitePanel";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminLeadsPanel from "@/app/admin/leads/AdminLeadsPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { loadAdminLeadsPageData } from "@/lib/admin-leads-page-server";

export default async function AdminBusinessLeadsPage() {
  const { leads, purchases } = await loadAdminLeadsPageData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads"
        description="Resource leads and checkout funnel status. Tap a lead for the full timeline."
        backHref={ADMIN_ROUTES.business.hub}
        backLabel="Business"
      />
      <AdminLegacyLeadInvitePanel />
      <AdminLeadsPanel leads={leads} purchases={purchases} view="leads" />
    </div>
  );
}
