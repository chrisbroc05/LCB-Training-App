import AppHighlightSlides from "@/app/admin/social/app-highlight/AppHighlightSlides";
import { DEMO_PARENT_RECAP_PARAMS } from "@/app/admin/social/app-highlight/demo-data";
import { buildParentWeeklyRecapEmail } from "@/lib/program-email-templates";

export default function AdminContentAppHighlightPage() {
  const parentRecap = buildParentWeeklyRecapEmail(DEMO_PARENT_RECAP_PARAMS);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 text-sm text-zinc-300">
        <h1 className="text-xl font-semibold text-zinc-100">App highlight export</h1>
        <p className="mt-2">
          Admin-only preview for Instagram story slides. Export PNGs with{" "}
          <code className="text-[#52B788]">npm run export:app-highlight</code>.
        </p>
      </header>
      <AppHighlightSlides parentRecapHtml={parentRecap.html} />
    </div>
  );
}
