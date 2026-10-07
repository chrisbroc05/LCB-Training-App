import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import TestingSessionGrid from "@/app/admin/testing/TestingSessionGrid";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

type PageProps = { params: Promise<{ teamId: string; sessionId: string }> };

export default async function AdminTestingSessionPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const { teamId, sessionId } = await params;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <TestingSessionGrid teamId={teamId} sessionId={sessionId} />
    </div>
  );
}
