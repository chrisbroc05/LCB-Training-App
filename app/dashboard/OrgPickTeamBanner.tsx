import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { userNeedsOrgTeamPick } from "@/lib/org-team-pick-shared";
import { prisma } from "@/lib/prisma";
import OrgPickTeamBannerClient from "@/app/dashboard/OrgPickTeamBannerClient";

type OrgPickTeamBannerProps = {
  userId: string;
};

export default async function OrgPickTeamBanner({ userId }: OrgPickTeamBannerProps) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userAccessSelect,
      orgTeamNotListedAt: true,
    },
  });
  if (!user?.organizationId) {
    return null;
  }

  const teams = await prisma.orgTeam.findMany({
    where: { organizationId: user.organizationId, active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  if (
    !userNeedsOrgTeamPick({
      organizationId: user.organizationId,
      orgTeamId: user.orgTeamId,
      orgTeamNotListedAt: user.orgTeamNotListedAt,
      activeTeamCount: teams.length,
    })
  ) {
    return null;
  }

  const access = toAccessUserFields(user);
  const orgName = access.orgName?.trim() || "Your club";

  return <OrgPickTeamBannerClient orgName={orgName} teams={teams} />;
}
