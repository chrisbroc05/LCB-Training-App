import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProgramDashboard } from "@/lib/program-access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import ProgramTodaySetupPrompt from "@/app/dashboard/ProgramTodaySetupPrompt";
import ProgramTodayView from "@/app/dashboard/ProgramTodayView";
import InPersonEmergencyReminderCard from "@/components/InPersonEmergencyReminderCard";
import { needsInPersonEmergencyContactReminder } from "@/lib/in-person-training-shared";

export default async function ProgramTodayPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      ...userAccessSelect,
      trainsInPerson: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
    },
  });

  if (!user) {
    redirect("/dashboard");
  }

  const access = toAccessUserFields(user);
  if (!canAccessProgramDashboard(access)) {
    redirect("/dashboard");
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompletedAt: true },
  });

  if (!enrollment) {
    redirect("/dashboard");
  }

  if (!enrollment.onboardingCompletedAt) {
    return <ProgramTodaySetupPrompt />;
  }

  const showInPersonEmergencyReminder = needsInPersonEmergencyContactReminder(user);

  return (
    <div className="mobile-card-stack px-4 pb-28 pt-2 md:mx-auto md:max-w-3xl md:px-6 md:pb-10 md:pt-6">
      {showInPersonEmergencyReminder ? <InPersonEmergencyReminderCard /> : null}
      <ProgramTodayView />
    </div>
  );
}
