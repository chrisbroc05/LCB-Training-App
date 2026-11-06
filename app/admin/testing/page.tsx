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

  return <TestingWorkspacePanel />;
}
