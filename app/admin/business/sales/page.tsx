import AdminLeadsPanel from "@/app/admin/leads/AdminLeadsPanel";
import { loadAdminLeadsPageData } from "@/lib/admin-leads-page-server";

export default async function AdminBusinessSalesPage() {
  const { leads, purchases } = await loadAdminLeadsPageData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Sales</h1>
        <p className="mt-2 text-sm text-zinc-400">Paid resource purchases.</p>
      </header>
      <AdminLeadsPanel leads={leads} purchases={purchases} view="sales" />
    </div>
  );
}
