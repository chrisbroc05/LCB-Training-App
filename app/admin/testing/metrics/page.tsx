import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import TestingMetricsPanel from "@/app/admin/testing/TestingMetricsPanel";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminTestingMetricsPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/admin/testing" className="text-sm text-zinc-400 hover:text-zinc-200">
        Back to testing
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Metrics settings</h1>
      <div className="mt-6">
        <TestingMetricsPanel />
      </div>
    </div>
  );
}
