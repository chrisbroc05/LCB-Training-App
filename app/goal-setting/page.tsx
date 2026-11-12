import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import GoalSettingPageBody from "@/app/goal-setting/GoalSettingPageBody";
import { canAccessGoalCheckin } from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { goalCheckinRequiredMessage } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export default async function GoalSettingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userAccessSelect,
  });

  if (!user) {
    redirect("/auth");
  }

  const access = toAccessUserFields(user);
  if (!canAccessGoalCheckin(access)) {
    return (
      <LockedFeaturePanel
        title="Monthly Goal Check-In"
        description="Submit your monthly goals and get personal feedback from Coach Broc."
        message={goalCheckinRequiredMessage}
        upgradeLabel="See membership levels"
        upgradeHref="/upgrade?level=ALL_ACCESS"
      />
    );
  }

  return <GoalSettingPageBody />;
}
