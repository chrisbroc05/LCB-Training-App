import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminLeadsPanel from "@/app/admin/leads/AdminLeadsPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { loadAdminLeadsPageData } from "@/lib/admin-leads-page-server";

export default async function AdminBusinessSalesPage() {
  const { leads, purchases } = await loadAdminLeadsPageData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sales"
        description="Paid resource purchases."
        backHref={ADMIN_ROUTES.business.hub}
        backLabel="Business"
      />
      <AdminLeadsPanel leads={leads} purchases={purchases} view="sales" />
    </div>
  );
}
