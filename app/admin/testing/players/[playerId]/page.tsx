import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import TestingPlayerProfile from "@/app/admin/testing/TestingPlayerProfile";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

type PageProps = { params: Promise<{ playerId: string }> };

export default async function AdminTestingPlayerPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const { playerId } = await params;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <TestingPlayerProfile playerId={playerId} />
    </div>
  );
}
