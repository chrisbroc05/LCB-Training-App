import "server-only";

import type { Organization, OrgTeam } from "@prisma/client";
import { isOrgTrialWindowActive, normalizeOrgJoinCode } from "@/lib/org-shared";
import type { AccessUserFields } from "@/lib/access-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import type { DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export const userOrgAccessSelect = {
  organizationId: true,
  orgTeamId: true,
  orgJoinedAt: true,
  orgTrialQuickReportUsed: true,
  coreQuickReportNextEligibleAt: true,
  organization: {
    select: {
      id: true,
      active: true,
      billingMode: true,
      coveredLevel: true,
      trialStartsAt: true,
      trialEndsAt: true,
    },
  },
} as const;

export function mergeOrgIntoAccessFields(
  user: {
    membershipTier: DatabaseTier | string;
    membershipLevel: string | null;
    membershipLevelExpiresAt: Date | null;
    playbookLegacyAccess: boolean;
    organizationId: string | null;
    orgTrialQuickReportUsed: boolean;
    coreQuickReportNextEligibleAt: Date | null;
    organization: {
      active: boolean;
      billingMode: "FAMILY_PAY" | "CLUB_PAY";
      coveredLevel: "CORE" | "PLUS" | "ALL_ACCESS" | null;
      trialStartsAt: Date | null;
      trialEndsAt: Date | null;
    } | null;
  },
): AccessUserFields {
  const org = user.organization;
  const trialActive =
    Boolean(org?.active && user.organizationId) &&
    isOrgTrialWindowActive(org?.trialStartsAt, org?.trialEndsAt);

  return {
    membershipTier: user.membershipTier as DatabaseTier,
    membershipLevel: (user.membershipLevel as MembershipLevelKey | null) ?? null,
    membershipLevelExpiresAt: user.membershipLevelExpiresAt,
    playbookLegacyAccess: user.playbookLegacyAccess,
    organizationId: user.organizationId,
    orgBillingMode: org?.billingMode ?? null,
    orgCoveredLevel: (org?.coveredLevel as MembershipLevelKey | null) ?? null,
    orgTrialActive: trialActive,
    orgTrialQuickReportUsed: user.orgTrialQuickReportUsed,
    coreQuickReportNextEligibleAt: user.coreQuickReportNextEligibleAt,
  };
}

export async function findOrganizationByJoinCode(codeRaw: string) {
  const code = normalizeOrgJoinCode(codeRaw);
  const row = await prisma.orgCode.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      active: true,
      organization: { active: true },
    },
    include: {
      organization: {
        include: {
          teams: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  return row;
}

export async function joinOrganizationForUser(params: {
  userId: string;
  codeRaw: string;
  orgTeamId?: string | null;
}) {
  const match = await findOrganizationByJoinCode(params.codeRaw);
  if (!match) {
    return { ok: false as const, error: "Invalid or inactive organization code." };
  }

  const org = match.organization;
  let teamId: string | null = params.orgTeamId ?? null;
  if (teamId) {
    const team = org.teams.find((entry) => entry.id === teamId);
    if (!team) {
      return { ok: false as const, error: "Invalid team selection." };
    }
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      organizationId: org.id,
      orgTeamId: teamId,
      orgJoinedAt: new Date(),
    },
  });

  return { ok: true as const, organization: org };
}

export type OrganizationAdminRecord = Organization & {
  codes: { id: string; code: string; label: string | null; active: boolean }[];
  teams: OrgTeam[];
  _count: { members: number };
};
