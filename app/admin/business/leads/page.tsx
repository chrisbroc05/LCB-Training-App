import AdminLeadsPanel from "@/app/admin/leads/AdminLeadsPanel";
import { loadAdminLeadsPageData } from "@/lib/admin-leads-page-server";

export default async function AdminBusinessLeadsPage() {
  const { leads, purchases } = await loadAdminLeadsPageData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Leads</h1>
        <p className="mt-2 text-sm text-zinc-400">Resource leads and checkout funnel status.</p>
      </header>
      <AdminLeadsPanel leads={leads} purchases={purchases} view="leads" />
    </div>
  );
}
