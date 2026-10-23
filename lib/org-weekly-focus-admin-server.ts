import "server-only";

import {
  buildTeamFocusPreview,
  formatWeekStartChicagoInputValue,
  formatWeekStartLabel,
  getWeekStartMondayChicago,
  parseWeekStartChicagoInput,
  type OrgWeeklyFocusRow,
  type TeamFocusPreviewRow,
} from "@/lib/org-weekly-focus-shared";
import { prisma } from "@/lib/prisma";

const MAX_DRILL_IDS = 3;

function normalizeDrillIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const ids = value.map((entry) => String(entry).trim()).filter(Boolean);
  return ids.slice(0, MAX_DRILL_IDS);
}

export type AdminOrgWeeklyFocusRecord = {
  id: string;
  weekStartDate: string;
  weekStartLabel: string;
  orgTeamId: string | null;
  teamName: string | null;
  scopeLabel: string;
  title: string;
  notes: string | null;
  drillIds: string[];
  createdAt: string;
  updatedAt: string;
};

function serializeFocus(row: {
  id: string;
  weekStartDate: Date;
  orgTeamId: string | null;
  title: string;
  notes: string | null;
  drillIds: string[];
  createdAt: Date;
  updatedAt: Date;
  orgTeam: { name: string } | null;
}): AdminOrgWeeklyFocusRecord {
  return {
    id: row.id,
    weekStartDate: formatWeekStartChicagoInputValue(row.weekStartDate),
    weekStartLabel: formatWeekStartLabel(row.weekStartDate),
    orgTeamId: row.orgTeamId,
    teamName: row.orgTeam?.name ?? null,
    scopeLabel: row.orgTeamId ? row.orgTeam?.name ?? "Team" : "Whole club",
    title: row.title,
    notes: row.notes,
    drillIds: row.drillIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAdminOrgWeeklyFocuses(organizationId: string) {
  const rows = await prisma.orgWeeklyFocus.findMany({
    where: { organizationId },
    orderBy: [{ weekStartDate: "desc" }, { createdAt: "desc" }],
    include: { orgTeam: { select: { name: true } } },
  });
  return rows.map(serializeFocus);
}

export async function saveAdminOrgWeeklyFocus(params: {
  organizationId: string;
  focusId?: string | null;
  weekStartInput: string;
  orgTeamId?: string | null;
  title: string;
  notes?: string | null;
  drillIds?: unknown;
}) {
  const title = params.title.trim();
  if (!title) {
    return { ok: false as const, error: "Title is required." };
  }

  const weekStart = parseWeekStartChicagoInput(params.weekStartInput);
  if (!weekStart) {
    return { ok: false as const, error: "Choose a valid week (Monday, Chicago time)." };
  }

  const orgTeamId = params.orgTeamId?.trim() ? params.orgTeamId.trim() : null;
  if (orgTeamId) {
    const team = await prisma.orgTeam.findFirst({
      where: { id: orgTeamId, organizationId: params.organizationId, active: true },
    });
    if (!team) {
      return { ok: false as const, error: "Choose a valid active team or Whole club." };
    }
  }

  const drillIds = normalizeDrillIds(params.drillIds);

  if (params.focusId) {
    const existing = await prisma.orgWeeklyFocus.findFirst({
      where: { id: params.focusId, organizationId: params.organizationId },
    });
    if (!existing) {
      return { ok: false as const, error: "Weekly focus not found." };
    }
    await prisma.orgWeeklyFocus.update({
      where: { id: params.focusId },
      data: {
        weekStartDate: weekStart,
        orgTeamId,
        title,
        notes: params.notes?.trim() || null,
        drillIds,
      },
    });
  } else {
    const duplicate = await prisma.orgWeeklyFocus.findFirst({
      where: {
        organizationId: params.organizationId,
        orgTeamId,
        weekStartDate: weekStart,
      },
    });
    if (duplicate) {
      await prisma.orgWeeklyFocus.update({
        where: { id: duplicate.id },
        data: { title, notes: params.notes?.trim() || null, drillIds },
      });
    } else {
      await prisma.orgWeeklyFocus.create({
        data: {
          organizationId: params.organizationId,
          orgTeamId,
          weekStartDate: weekStart,
          title,
          notes: params.notes?.trim() || null,
          drillIds,
        },
      });
    }
  }

  return { ok: true as const };
}

export async function deleteAdminOrgWeeklyFocus(organizationId: string, focusId: string) {
  const existing = await prisma.orgWeeklyFocus.findFirst({
    where: { id: focusId, organizationId },
  });
  if (!existing) {
    return { ok: false as const, error: "Weekly focus not found." };
  }
  await prisma.orgWeeklyFocus.delete({ where: { id: focusId } });
  return { ok: true as const };
}

export async function buildAdminWeeklyFocusPayload(organizationId: string, weekInput?: string) {
  const focuses = await listAdminOrgWeeklyFocuses(organizationId);
  const teams = await prisma.orgTeam.findMany({
    where: { organizationId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, active: true },
  });

  const weekStart = weekInput
    ? parseWeekStartChicagoInput(weekInput) ?? getWeekStartMondayChicago()
    : getWeekStartMondayChicago();

  const focusRows: OrgWeeklyFocusRow[] = focuses.map((row) => ({
    id: row.id,
    orgTeamId: row.orgTeamId,
    weekStartDate: row.weekStartDate,
    title: row.title,
    notes: row.notes,
    drillIds: row.drillIds,
  }));

  const teamPreview = buildTeamFocusPreview({
    teams,
    focuses: focusRows,
    weekStart,
  });

  return {
    focuses,
    teamPreview,
    defaultWeekStart: formatWeekStartChicagoInputValue(weekStart),
  };
}

export type { TeamFocusPreviewRow };
