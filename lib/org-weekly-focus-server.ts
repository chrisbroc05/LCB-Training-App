import "server-only";

import { getWeekStartMondayUtc } from "@/lib/org-weekly-focus-shared";
import { prisma } from "@/lib/prisma";

export async function loadCurrentOrgWeeklyFocusForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      orgTeamId: true,
      organization: { select: { name: true, active: true } },
      orgTeam: { select: { name: true } },
    },
  });

  if (!user?.organizationId || !user.organization?.active) {
    return null;
  }

  const weekStart = getWeekStartMondayUtc();
  const teamFocus = user.orgTeamId
    ? await prisma.orgWeeklyFocus.findFirst({
        where: {
          organizationId: user.organizationId,
          orgTeamId: user.orgTeamId,
          weekStartDate: weekStart,
        },
      })
    : null;

  const orgFocus =
    teamFocus ??
    (await prisma.orgWeeklyFocus.findFirst({
      where: {
        organizationId: user.organizationId,
        orgTeamId: null,
        weekStartDate: weekStart,
      },
    }));

  if (!orgFocus) {
    return null;
  }

  return {
    organizationName: user.organization.name,
    teamName: user.orgTeam?.name ?? null,
    title: orgFocus.title,
    notes: orgFocus.notes,
    drillIds: orgFocus.drillIds,
    weekStartDate: orgFocus.weekStartDate.toISOString(),
  };
}
