import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminProgramCuesPanel from "@/app/admin/program/cues/AdminProgramCuesPanel";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminProgramCuesPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <AdminProgramCuesPanel />
    </div>
  );
}
