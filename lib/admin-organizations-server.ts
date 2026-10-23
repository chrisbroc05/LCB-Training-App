import "server-only";

import type { MembershipLevel } from "@prisma/client";
import {
  type AdminOrganizationRecord,
  slugifyOrganizationName,
} from "@/lib/admin-organizations-shared";
import { normalizeOrgJoinCode } from "@/lib/org-shared";
import {
  trialEndInstantFromDateInput,
  trialStartInstantFromDateInput,
} from "@/lib/org-trial-dates-shared";
import { prisma } from "@/lib/prisma";

function parseMembershipLevel(value: unknown): MembershipLevel | null {
  if (value === "CORE" || value === "PLUS" || value === "ALL_ACCESS") {
    return value;
  }
  return null;
}

function commissionWindowStart(org: { commissionMonths: number }) {
  const start = new Date();
  start.setUTCMonth(start.getUTCMonth() - org.commissionMonths);
  return start;
}

export async function listAdminOrganizations(): Promise<AdminOrganizationRecord[]> {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      codes: { orderBy: { createdAt: "asc" } },
      teams: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { members: true } } } },
      _count: { select: { members: true } },
    },
  });

  const records: AdminOrganizationRecord[] = [];
  for (const org of orgs) {
    const windowStart = commissionWindowStart(org);
    const commissionAttributionCount = await prisma.user.count({
      where: {
        organizationId: org.id,
        orgJoinedAt: { gte: windowStart },
      },
    });

    records.push({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      active: org.active,
      billingMode: org.billingMode,
      coveredLevel: org.coveredLevel,
      trialStartsAt: org.trialStartsAt?.toISOString() ?? null,
      trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
      trialLockedCopy: org.trialLockedCopy,
      commissionRate: org.commissionRate,
      commissionMonths: org.commissionMonths,
      memberCount: org._count.members,
      commissionAttributionCount,
      codes: org.codes.map((code) => ({
        id: code.id,
        code: code.code,
        label: code.label,
        active: code.active,
      })),
      teams: org.teams.map((team) => ({
        id: team.id,
        name: team.name,
        sortOrder: team.sortOrder,
        active: team.active,
        memberCount: team._count.members,
      })),
    });
  }

  return records;
}

export async function createAdminOrganization(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  if (!name) {
    return { ok: false as const, error: "Organization name is required." };
  }

  const slugRaw = String(body.slug ?? "").trim();
  const slug = slugRaw || slugifyOrganizationName(name);
  if (!slug) {
    return { ok: false as const, error: "Organization slug is required." };
  }

  const billingMode = body.billingMode === "CLUB_PAY" ? "CLUB_PAY" : "FAMILY_PAY";
  const coveredLevel = parseMembershipLevel(body.coveredLevel);
  const trialStartsAt = body.trialStartsAt
    ? trialStartInstantFromDateInput(String(body.trialStartsAt))
    : null;
  const trialEndsAt = body.trialEndsAt
    ? trialEndInstantFromDateInput(String(body.trialEndsAt))
    : null;
  const commissionRate = Number(body.commissionRate ?? 0);
  const commissionMonths = Number(body.commissionMonths ?? 0);

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      active: body.active !== false,
      billingMode,
      coveredLevel: billingMode === "CLUB_PAY" ? coveredLevel : null,
      trialStartsAt,
      trialEndsAt,
      trialLockedCopy: body.trialLockedCopy ? String(body.trialLockedCopy).trim() : null,
      commissionRate: Number.isFinite(commissionRate) ? commissionRate : 0,
      commissionMonths: Number.isFinite(commissionMonths) ? Math.max(0, Math.floor(commissionMonths)) : 0,
    },
  });

  return { ok: true as const, organizationId: org.id };
}

export async function updateAdminOrganization(orgId: string, body: Record<string, unknown>) {
  const existing = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!existing) {
    return { ok: false as const, error: "Organization not found." };
  }

  const billingMode =
    body.billingMode === "CLUB_PAY" || body.billingMode === "FAMILY_PAY"
      ? body.billingMode
      : existing.billingMode;
  const coveredLevel =
    body.coveredLevel !== undefined
      ? parseMembershipLevel(body.coveredLevel)
      : existing.coveredLevel;

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      slug: body.slug !== undefined ? String(body.slug).trim() : undefined,
      active: body.active !== undefined ? Boolean(body.active) : undefined,
      billingMode,
      coveredLevel: billingMode === "CLUB_PAY" ? coveredLevel : null,
      trialStartsAt:
        body.trialStartsAt !== undefined
          ? body.trialStartsAt
            ? trialStartInstantFromDateInput(String(body.trialStartsAt))
            : null
          : undefined,
      trialEndsAt:
        body.trialEndsAt !== undefined
          ? body.trialEndsAt
            ? trialEndInstantFromDateInput(String(body.trialEndsAt))
            : null
          : undefined,
      trialLockedCopy:
        body.trialLockedCopy !== undefined
          ? body.trialLockedCopy
            ? String(body.trialLockedCopy).trim()
            : null
          : undefined,
      commissionRate:
        body.commissionRate !== undefined ? Number(body.commissionRate) : undefined,
      commissionMonths:
        body.commissionMonths !== undefined ? Number(body.commissionMonths) : undefined,
    },
  });

  return { ok: true as const };
}

export async function upsertOrgCode(orgId: string, body: Record<string, unknown>) {
  const code = normalizeOrgJoinCode(String(body.code ?? ""));
  if (!code) {
    return { ok: false as const, error: "Join code is required." };
  }

  const label = body.label ? String(body.label).trim() : null;
  const active = body.active !== false;

  if (body.id) {
    await prisma.orgCode.update({
      where: { id: String(body.id) },
      data: { code, label, active },
    });
    return { ok: true as const };
  }

  await prisma.orgCode.create({
    data: { organizationId: orgId, code, label, active },
  });
  return { ok: true as const };
}

export async function upsertOrgTeam(orgId: string, body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  if (!name) {
    return { ok: false as const, error: "Team name is required." };
  }

  const sortOrder = Number(body.sortOrder ?? 0);

  if (body.id) {
    const existingTeam = await prisma.orgTeam.findUnique({ where: { id: String(body.id) } });
    if (!existingTeam || existingTeam.organizationId !== orgId) {
      return { ok: false as const, error: "Team not found." };
    }
    await prisma.orgTeam.update({
      where: { id: String(body.id) },
      data: {
        name: name || existingTeam.name,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : existingTeam.sortOrder,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
      },
    });
    return { ok: true as const };
  }

  await prisma.orgTeam.create({
    data: {
      organizationId: orgId,
      name,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });
  return { ok: true as const };
}

export async function moveOrganizationMembers(params: {
  organizationId: string;
  userIds: string[];
  orgTeamId: string | null;
}) {
  if (!params.userIds.length) {
    return { ok: false as const, error: "Select at least one member." };
  }

  if (params.orgTeamId) {
    const team = await prisma.orgTeam.findFirst({
      where: {
        id: params.orgTeamId,
        organizationId: params.organizationId,
        active: true,
      },
    });
    if (!team) {
      return { ok: false as const, error: "Invalid team selection." };
    }
  }

  const changedAt = new Date();
  await prisma.user.updateMany({
    where: {
      id: { in: params.userIds },
      organizationId: params.organizationId,
    },
    data: {
      orgTeamId: params.orgTeamId,
      orgTeamChangedAt: params.orgTeamId ? changedAt : null,
    },
  });

  return { ok: true as const };
}

export async function listOrganizationMembers(orgId: string) {
  const members = await prisma.user.findMany({
    where: { organizationId: orgId },
    orderBy: { signupDate: "desc" },
    select: {
      id: true,
      email: true,
      playerFirstName: true,
      playerLastName: true,
      name: true,
      orgTeamId: true,
      orgTeam: { select: { name: true } },
    },
  });

  return members.map((member) => ({
    id: member.id,
    email: member.email,
    name:
      [member.playerFirstName, member.playerLastName].filter(Boolean).join(" ").trim() ||
      member.name?.trim() ||
      member.email,
    orgTeamId: member.orgTeamId,
    orgTeamName: member.orgTeam?.name ?? null,
  }));
}

export async function buildOrganizationRosterCsv(orgId: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });
  if (!org) {
    throw new Error("Organization not found.");
  }

  const members = await prisma.user.findMany({
    where: { organizationId: orgId },
    orderBy: [{ orgTeam: { sortOrder: "asc" } }, { signupDate: "asc" }],
    select: {
      email: true,
      playerFirstName: true,
      playerLastName: true,
      name: true,
      orgJoinedAt: true,
      orgTeam: { select: { name: true } },
    },
  });

  const header = ["email", "player_name", "team", "joined_at"].join(",");
  const rows = members.map((member) => {
    const playerName =
      [member.playerFirstName, member.playerLastName].filter(Boolean).join(" ").trim() ||
      member.name?.trim() ||
      "";
    const joined = member.orgJoinedAt?.toISOString() ?? "";
    const team = member.orgTeam?.name ?? "";
    return [member.email, playerName, team, joined]
      .map((value) => `"${value.replace(/"/g, '""')}"`)
      .join(",");
  });

  return [header, ...rows].join("\n");
}
