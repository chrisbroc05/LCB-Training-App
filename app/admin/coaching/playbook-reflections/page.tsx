import { Suspense } from "react";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminPanel from "@/app/admin/AdminPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminPlaybookReflectionsPage() {
  return (
    <section className="admin-page-section">
      <AdminPageHeader
        title="Playbook reflections"
        description="Reflections members shared from The Next Level Playbook."
        backHref={ADMIN_ROUTES.coaching.hub}
        backLabel="Coaching"
      />
      <Suspense fallback={<p className="mt-6 text-zinc-400">Loading...</p>}>
        <AdminPanel mode="playbook" />
      </Suspense>
    </section>
  );
}
