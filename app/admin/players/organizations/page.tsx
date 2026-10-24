import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminOrganizationsPanel from "@/app/admin/organizations/AdminOrganizationsPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminPlayersOrganizationsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Organizations"
        description="Club partnerships, join codes, roster export, and weekly team focus."
        backHref={ADMIN_ROUTES.players.hub}
        backLabel="Players"
      />
      <AdminOrganizationsPanel />
    </div>
  );
}
