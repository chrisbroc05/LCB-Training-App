import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminWaiversPanel from "@/app/admin/waivers/AdminWaiversPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminPlayersWaiversPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Waivers"
        description="Signed waivers and export."
        backHref={ADMIN_ROUTES.players.hub}
        backLabel="Players"
      />
      <AdminWaiversPanel />
    </div>
  );
}
