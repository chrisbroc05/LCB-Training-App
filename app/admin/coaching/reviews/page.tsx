import { Suspense } from "react";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminPanel from "@/app/admin/AdminPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminCoachingReviewsPage() {
  return (
    <section className="admin-page-section">
      <AdminPageHeader
        title="Video reviews"
        description="Swing and mental game submissions waiting for a response."
        backHref={ADMIN_ROUTES.coaching.hub}
        backLabel="Coaching"
      />
      <Suspense fallback={<p className="mt-6 text-zinc-400">Loading submissions...</p>}>
        <AdminPanel mode="reviews" />
      </Suspense>
    </section>
  );
}
