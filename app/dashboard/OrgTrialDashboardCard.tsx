import { resolveEffectiveLevel } from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { getOrgTrialIncludesLine } from "@/lib/org-trial-copy-shared";
import { formatChicagoTrialEndLabel } from "@/lib/org-trial-dates-shared";
import { resolveOrgTrialDashboardCardVisibility } from "@/lib/org-trial-dashboard-shared";
import { prisma } from "@/lib/prisma";
import OrgTrialDashboardCardClient from "@/app/dashboard/OrgTrialDashboardCardClient";

type OrgTrialDashboardCardProps = {
  userId: string;
};

export default async function OrgTrialDashboardCard({ userId }: OrgTrialDashboardCardProps) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userAccessSelect,
      orgTrialDashboardDismissedAt: true,
      orgTeam: { select: { id: true, name: true, active: true } },
    },
  });
  if (!user) {
    return null;
  }

  const access = toAccessUserFields(user);
  if (resolveEffectiveLevel(access) !== "ORG_TRIAL") {
    return null;
  }

  const visibility = resolveOrgTrialDashboardCardVisibility({
    dismissedAt: user.orgTrialDashboardDismissedAt,
    trialEndsAt: access.orgTrialEndsAt ?? null,
  });
  if (!visibility.show) {
    return null;
  }

  const orgName = access.orgName?.trim() || "Your organization";
  const endLabel = formatChicagoTrialEndLabel(access.orgTrialEndsAt ?? null);
  const trialEndsAtIso = access.orgTrialEndsAt
    ? (access.orgTrialEndsAt instanceof Date
        ? access.orgTrialEndsAt
        : new Date(access.orgTrialEndsAt)
      ).toISOString()
    : null;

  return (
    <OrgTrialDashboardCardClient
      orgName={orgName}
      includesLine={getOrgTrialIncludesLine()}
      endLabel={endLabel}
      trialEndsAtIso={trialEndsAtIso}
      teamName={access.orgTeamName ?? user.orgTeam?.name ?? null}
      mode={visibility.mode}
      allowDismiss={visibility.mode === "standard"}
    />
  );
}
