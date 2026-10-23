import "server-only";

import { resolveEffectiveLevel, type AccessUserFields } from "@/lib/access-shared";
import { loadAccessUserFields } from "@/lib/access-server";
import {
  getWeekStartMondayChicago,
  pickOrgWeeklyFocusForMember,
  type OrgWeeklyFocusRow,
} from "@/lib/org-weekly-focus-shared";
import { prisma } from "@/lib/prisma";

function isOrgMemberWithWeeklyFocusAccess(access: AccessUserFields): boolean {
  if (!access.organizationId) {
    return false;
  }
  const effective = resolveEffectiveLevel(access);
  return (
    effective === "ORG_TRIAL" ||
    effective === "CORE" ||
    effective === "PLUS" ||
    effective === "ALL_ACCESS"
  );
}

export async function loadCurrentOrgWeeklyFocusForUser(userId: string) {
  const [user, access] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
        orgTeamId: true,
        orgTeam: { select: { name: true } },
        organization: { select: { name: true, active: true } },
      },
    }),
    loadAccessUserFields(userId),
  ]);

  if (!user?.organizationId || !user.organization?.active || !access) {
    return null;
  }

  if (!isOrgMemberWithWeeklyFocusAccess(access)) {
    return null;
  }

  const weekStart = getWeekStartMondayChicago();
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const rows = await prisma.orgWeeklyFocus.findMany({
    where: {
      organizationId: user.organizationId,
      weekStartDate: { gte: weekStart, lt: weekEnd },
    },
  });

  const focusRows: OrgWeeklyFocusRow[] = rows.map((row) => ({
    id: row.id,
    orgTeamId: row.orgTeamId,
    weekStartDate: row.weekStartDate,
    title: row.title,
    notes: row.notes,
    drillIds: row.drillIds,
  }));

  const picked = pickOrgWeeklyFocusForMember(focusRows, user.orgTeamId, weekStart);
  if (!picked) {
    return null;
  }

  return {
    organizationName: user.organization.name,
    teamName: user.orgTeam?.name ?? null,
    title: picked.title,
    notes: picked.notes,
    drillIds: picked.drillIds,
    weekStartDate: weekStart.toISOString(),
  };
}

/** Used by tests and admin tooling to verify save + member read paths. */
export async function readOrgWeeklyFocusForMember(params: {
  organizationId: string;
  orgTeamId: string | null;
  weekStart?: Date;
}) {
  const weekStart = params.weekStart ?? getWeekStartMondayChicago();
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const rows = await prisma.orgWeeklyFocus.findMany({
    where: {
      organizationId: params.organizationId,
      weekStartDate: { gte: weekStart, lt: weekEnd },
    },
  });
  const focusRows: OrgWeeklyFocusRow[] = rows.map((row) => ({
    id: row.id,
    orgTeamId: row.orgTeamId,
    weekStartDate: row.weekStartDate,
    title: row.title,
    notes: row.notes,
    drillIds: row.drillIds,
  }));
  return pickOrgWeeklyFocusForMember(focusRows, params.orgTeamId, weekStart);
}
