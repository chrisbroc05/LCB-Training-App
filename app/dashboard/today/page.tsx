import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTwelveWeekProgramMember } from "@/lib/membership";
import ProgramTodayView from "@/app/dashboard/ProgramTodayView";

export default async function ProgramTodayPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });

  if (!user || !isTwelveWeekProgramMember(user.membershipTier)) {
    redirect("/dashboard");
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompletedAt: true },
  });

  if (!enrollment?.onboardingCompletedAt) {
    redirect("/program/start");
  }

  return (
    <div className="min-h-full bg-[#F4F6F8]">
      <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 md:max-w-3xl md:pb-10 md:pt-8">
        <ProgramTodayView />
      </div>
    </div>
  );
}
