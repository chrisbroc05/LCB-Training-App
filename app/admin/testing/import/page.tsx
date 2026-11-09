import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import TestingResultsCsvImportPanel from "@/app/admin/testing/TestingResultsCsvImportPanel";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminTestingImportPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/admin");
  }

  return <TestingResultsCsvImportPanel />;
}
