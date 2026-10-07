import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import TestingTeamPanel from "@/app/admin/testing/TestingTeamPanel";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

type PageProps = { params: Promise<{ teamId: string }> };

export default async function AdminTestingTeamPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const { teamId } = await params;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <TestingTeamPanel teamId={teamId} />
    </div>
  );
}
