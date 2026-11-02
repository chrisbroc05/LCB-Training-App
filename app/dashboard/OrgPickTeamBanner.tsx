import { resolveEffectiveLevel } from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { prisma } from "@/lib/prisma";
import OrgPickTeamBannerClient from "@/app/dashboard/OrgPickTeamBannerClient";

type OrgPickTeamBannerProps = {
  userId: string;
};

export default async function OrgPickTeamBanner({ userId }: OrgPickTeamBannerProps) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAccessSelect,
  });
  if (!user?.organizationId || user.orgTeamId) {
    return null;
  }

  const access = toAccessUserFields(user);
  if (resolveEffectiveLevel(access) !== "ORG_TRIAL") {
    return null;
  }

  const activeTeamCount = await prisma.orgTeam.count({
    where: { organizationId: user.organizationId, active: true },
  });
  const hasTeams = activeTeamCount > 0;
  if (!hasTeams) {
    return null;
  }

  const orgName = access.orgName?.trim() || "Your club";

  return <OrgPickTeamBannerClient userId={userId} orgName={orgName} />;
}
