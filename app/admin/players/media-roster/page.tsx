import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminMediaRosterPanel from "@/app/admin/AdminMediaRosterPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminMediaRosterPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media roster"
        description="Phone-friendly media choices by team or clinic before you post."
        backHref={ADMIN_ROUTES.players.hub}
        backLabel="Players"
      />
      <AdminMediaRosterPanel />
    </div>
  );
}
