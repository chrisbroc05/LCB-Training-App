import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import AppHighlightSlides from "@/app/admin/social/app-highlight/AppHighlightSlides";
import { buildParentWeeklyRecapEmail } from "@/lib/program-email-templates";
import { DEMO_PARENT_RECAP_PARAMS } from "@/app/admin/social/app-highlight/demo-data";

export default async function AppHighlightPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const parentRecap = buildParentWeeklyRecapEmail(DEMO_PARENT_RECAP_PARAMS);

  return (
    <div className="min-h-screen bg-[#050b16]">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 text-sm text-zinc-300">
          <h1 className="text-xl font-semibold text-zinc-100">OUR APP highlight export</h1>
          <p className="mt-2">
            Admin-only preview for Instagram story slides. Export PNGs with{" "}
            <code className="text-[#52B788]">npm run export:app-highlight</code>.
          </p>
        </div>
        <AppHighlightSlides parentRecapHtml={parentRecap.html} />
      </div>
    </div>
  );
}
