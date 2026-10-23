import Link from "next/link";
import AdminGrantAccessByEmailPanel from "@/app/admin/AdminGrantAccessByEmailPanel";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminBusinessGrantsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Product grants</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Grant or remove playbook, 12-week, and remote session access by email. Per-member product
          access lives in{" "}
          <Link href={ADMIN_ROUTES.players.members} className="text-[#52B788] underline">
            Members
          </Link>
          .
        </p>
      </header>
      <AdminGrantAccessByEmailPanel />
    </div>
  );
}
