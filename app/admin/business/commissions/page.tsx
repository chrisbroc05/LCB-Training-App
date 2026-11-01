import AdminPageHeader from "@/app/admin/AdminPageHeader";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import {
  listAdminCommissionOrganizations,
  loadAdminCommissionOrgSummary,
} from "@/lib/admin-commissions-server";
import AdminOrgCommissionsPicker from "@/app/admin/business/AdminOrgCommissionsPicker";
import AdminCommissionsOrgPanel from "@/app/admin/business/AdminCommissionsOrgPanel";

type PageProps = {
  searchParams: Promise<{ orgId?: string }>;
};

export default async function AdminCommissionsPage({ searchParams }: PageProps) {
  const { orgId } = await searchParams;
  const organizations = await listAdminCommissionOrganizations();
  const summary = orgId ? await loadAdminCommissionOrgSummary(orgId) : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Commissions"
        description="Org commission ledger, carryover, payouts, and family eligibility (Phase 2B)."
        backHref={ADMIN_ROUTES.business.hub}
        backLabel="Business"
      />

      <AdminOrgCommissionsPicker organizations={organizations} selectedOrgId={orgId ?? ""} />

      {!orgId ? (
        <p className="text-sm text-zinc-400">Choose an organization to view commission activity.</p>
      ) : !summary ? (
        <p className="text-sm text-red-300">Organization not found.</p>
      ) : (
        <AdminCommissionsOrgPanel initialSummary={summary} />
      )}
    </div>
  );
}
