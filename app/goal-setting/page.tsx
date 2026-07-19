import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import GoalSettingPageBody from "@/app/goal-setting/GoalSettingPageBody";
import { canAccessCoachingNav } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export default async function GoalSettingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });

  if (!user) {
    redirect("/auth");
  }

  if (!canAccessCoachingNav(user.membershipTier)) {
    return (
      <LockedFeaturePanel
        title="Monthly Goal Check-In"
        description="Submit your monthly goals and get personal feedback from Coach Broc."
        message="Monthly goal check-ins are available on Memorable and Elite memberships. Upgrade to Memorable for 1-on-1 coaching, monthly swing analysis and mental game support submissions, and accountability support."
        upgradeLabel="Upgrade to Memorable"
        upgradeHref="/upgrade?reason=memorable-required"
      />
    );
  }

  return <GoalSettingPageBody />;
}
