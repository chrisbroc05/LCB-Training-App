import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import AdminReportsPanel from "@/app/admin/reports/AdminReportsPanel";

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Written Reports</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Quick written evaluations for Core, org trial, and free swing submissions.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex rounded-full border border-[#2b3650] px-4 py-2 text-sm font-semibold text-zinc-200"
          >
            Back to admin
          </Link>
        </div>
        <AdminReportsPanel />
      </section>
    </div>
  );
}
