import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AppHighlightSlides from "@/app/admin/social/app-highlight/AppHighlightSlides";
import { DEMO_PARENT_RECAP_PARAMS } from "@/app/admin/social/app-highlight/demo-data";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { buildParentWeeklyRecapEmail } from "@/lib/program-email-templates";

export default function AdminContentAppHighlightPage() {
  const parentRecap = buildParentWeeklyRecapEmail(DEMO_PARENT_RECAP_PARAMS);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="App highlight export"
        description="Admin-only preview for Instagram story slides. Export PNGs with npm run export:app-highlight."
        backHref={ADMIN_ROUTES.content.hub}
        backLabel="Content"
      />
      <AppHighlightSlides parentRecapHtml={parentRecap.html} />
    </div>
  );
}
