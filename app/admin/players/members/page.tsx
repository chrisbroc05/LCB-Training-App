import { Suspense } from "react";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminPanel from "@/app/admin/AdminPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminPlayersMembersPage() {
  return (
    <section className="admin-page-section">
      <AdminPageHeader
        title="Members"
        description="Full member CRM: tier, access, calls, and product grants."
        backHref={ADMIN_ROUTES.players.hub}
        backLabel="Players"
      />
      <Suspense fallback={<p className="mt-6 text-zinc-400">Loading...</p>}>
        <AdminPanel mode="members" />
      </Suspense>
    </section>
  );
}
