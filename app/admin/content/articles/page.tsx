import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminArticlesPanel from "@/app/admin/content/articles/AdminArticlesPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminArticlesPage() {
  return (
    <section className="admin-page-section">
      <AdminPageHeader
        title="Articles"
        description="Create and publish Markdown articles for /articles."
        backHref={ADMIN_ROUTES.content.hub}
        backLabel="Content"
      />
      <div className="mt-6">
        <AdminArticlesPanel />
      </div>
    </section>
  );
}
