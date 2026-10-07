import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import TestingWorkspacePanel from "@/app/admin/testing/TestingWorkspacePanel";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminTestingPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <TestingWorkspacePanel />
    </div>
  );
}
