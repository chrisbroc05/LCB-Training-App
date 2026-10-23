import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import AdminOrganizationsPanel from "@/app/admin/organizations/AdminOrganizationsPanel";

export default async function AdminOrganizationsPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Organizations</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Club partnerships, join codes, roster export, and weekly team focus.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200"
        >
          Back to admin
        </Link>
      </div>
      <AdminOrganizationsPanel />
    </div>
  );
}
