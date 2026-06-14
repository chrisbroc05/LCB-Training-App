import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import AdminPanel from "@/app/admin/AdminPanel";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-3xl font-semibold text-zinc-100">Admin Submissions Inbox</h1>
        <p className="mt-2 text-zinc-300">
          Review swing analysis and mental game submissions, then send video or written responses.
        </p>
        <AdminPanel />
      </section>
    </div>
  );
}
