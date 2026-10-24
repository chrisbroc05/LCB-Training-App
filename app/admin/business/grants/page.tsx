import Link from "next/link";
import AdminGrantAccessByEmailPanel from "@/app/admin/AdminGrantAccessByEmailPanel";
import AdminPageHeader from "@/app/admin/AdminPageHeader";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminBusinessGrantsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Product grants"
        description="Grant or remove playbook, 12-week, and remote session access by email."
        backHref={ADMIN_ROUTES.business.hub}
        backLabel="Business"
      />
      <p className="text-sm text-zinc-400">
        Per-member product access lives in{" "}
        <Link href={ADMIN_ROUTES.players.members} className="text-[#52B788] underline">
          Members
        </Link>
        .
      </p>
      <AdminGrantAccessByEmailPanel />
    </div>
  );
}
