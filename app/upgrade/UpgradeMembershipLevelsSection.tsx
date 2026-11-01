import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MembershipLevelsPricingGrid from "@/app/upgrade/MembershipLevelsPricingGrid";
import { listPublicMembershipLevelDefinitions } from "@/lib/membership-levels-shared";
import { isAllAccessCheckoutAvailable } from "@/lib/membership-subscription-server";
import { prisma } from "@/lib/prisma";

export default async function UpgradeMembershipLevelsSection() {
  if (listPublicMembershipLevelDefinitions().length === 0) {
    return null;
  }

  const session = await getServerSession(authOptions);
  const allAccessAvailable = await isAllAccessCheckoutAvailable();

  let clubOrgName: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organization: { select: { name: true } } },
    });
    clubOrgName = user?.organization?.name?.trim() ?? null;
  }

  return (
    <MembershipLevelsPricingGrid
      signedIn={Boolean(session?.user?.id)}
      allAccessAvailable={allAccessAvailable}
      clubOrgName={clubOrgName}
    />
  );
}
