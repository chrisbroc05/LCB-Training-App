import { Suspense } from "react";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminPanel from "@/app/admin/AdminPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminGoalCheckinsPage() {
  return (
    <section className="admin-page-section">
      <AdminPageHeader
        title="Goal check-ins"
        description="Monthly goal check-ins from 12-week players."
        backHref={ADMIN_ROUTES.coaching.hub}
        backLabel="Coaching"
      />
      <Suspense fallback={<p className="mt-6 text-zinc-400">Loading...</p>}>
        <AdminPanel mode="goal" />
      </Suspense>
    </section>
  );
}
