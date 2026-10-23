import AdminOrganizationsPanel from "@/app/admin/organizations/AdminOrganizationsPanel";

export default function AdminPlayersOrganizationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Organizations</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Club partnerships, join codes, roster export, and weekly team focus.
        </p>
      </header>
      <AdminOrganizationsPanel />
    </div>
  );
}
