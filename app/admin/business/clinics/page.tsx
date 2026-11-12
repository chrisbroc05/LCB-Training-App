import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminClinicsPanel from "@/app/admin/business/clinics/AdminClinicsPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminClinicsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Clinics"
        description="Create clinics, track capacity, export rosters, and mark refunds."
        backHref={ADMIN_ROUTES.business.hub}
        backLabel="Business"
      />
      <AdminClinicsPanel />
    </div>
  );
}
