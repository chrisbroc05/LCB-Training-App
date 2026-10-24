import Link from "next/link";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminContentFixItPage() {
  return (
    <section className="admin-page-section">
      <AdminPageHeader
        title="Fix-It plans"
        description="Fix-It access is granted per member from the CRM."
        backHref={ADMIN_ROUTES.content.hub}
        backLabel="Content"
      />
      <p className="mt-3 text-sm text-zinc-300">
        There is no separate Fix-It catalog in admin. Fix-It access is granted per member from the
        Members CRM (product access panel on each profile).
      </p>
      <Link
        href={ADMIN_ROUTES.players.members}
        className="mt-6 inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black"
      >
        Open Members
      </Link>
    </section>
  );
}
