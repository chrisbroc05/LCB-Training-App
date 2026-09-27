import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ProgramStatsView from "@/app/program/stats/ProgramStatsView";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProgramStatsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment?.onboardingCompletedAt) {
    redirect("/program/start");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <ProgramStatsView />
    </div>
  );
}
