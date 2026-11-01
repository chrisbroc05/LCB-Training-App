import "server-only";

import type { Organization, OrgTeam } from "@prisma/client";
import { isOrgTrialWindowActive, normalizeOrgJoinCode } from "@/lib/org-shared";
import type { AccessUserFields } from "@/lib/access-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import type { DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { resolveCommissionEligibilityForOrgJoin } from "@/lib/commission-eligibility-server";

export const userOrgAccessSelect = {
  organizationId: true,
  orgTeamId: true,
  orgJoinedAt: true,
  orgTrialQuickReportUsed: true,
  coreQuickReportNextEligibleAt: true,
  orgTeam: {
    select: {
      id: true,
      name: true,
      active: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
      active: true,
      billingMode: true,
      coveredLevel: true,
      trialStartsAt: true,
      trialEndsAt: true,
      trialLockedCopy: true,
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
    orgTeamId?: string | null;
    orgTrialQuickReportUsed: boolean;
    coreQuickReportNextEligibleAt: Date | null;
    orgTeam?: { id: string; name: string; active: boolean } | null;
    organization: {
      name?: string;
      logoUrl?: string | null;
      active: boolean;
      billingMode: "FAMILY_PAY" | "CLUB_PAY";
      coveredLevel: "CORE" | "PLUS" | "ALL_ACCESS" | null;
      trialStartsAt: Date | null;
      trialEndsAt: Date | null;
      trialLockedCopy?: string | null;
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
    orgName: org?.name ?? null,
    orgLogoUrl: org?.logoUrl ?? null,
    orgTrialLockedCopy: org?.trialLockedCopy ?? null,
    orgTrialEndsAt: org?.trialEndsAt ?? null,
    orgBillingMode: org?.billingMode ?? null,
    orgCoveredLevel: (org?.coveredLevel as MembershipLevelKey | null) ?? null,
    orgTrialActive: trialActive,
    orgTrialQuickReportUsed: user.orgTrialQuickReportUsed,
    coreQuickReportNextEligibleAt: user.coreQuickReportNextEligibleAt,
    orgTeamId: user.orgTeamId ?? null,
    orgTeamName: user.orgTeam?.name ?? null,
    orgTeamActive: user.orgTeam?.active ?? null,
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
          teams: {
            where: { active: true },
            orderBy: { sortOrder: "asc" },
          },
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
    const team = await prisma.orgTeam.findFirst({
      where: { id: teamId, organizationId: org.id, active: true },
    });
    if (!team) {
      return { ok: false as const, error: "Invalid team selection." };
    }
  }

  const joinedAt = new Date();
  const existing = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      email: true,
      orgJoinedAt: true,
      commissionAttributionOrgId: true,
      commissionAttributionJoinedAt: true,
      commissionEligibleAdminOverride: true,
    },
  });

  const effectiveJoinedAt = existing?.orgJoinedAt ?? joinedAt;
  const isFirstCommissionAttribution =
    !existing?.commissionAttributionOrgId && org.commissionRate > 0;
  const attributionOrgId = isFirstCommissionAttribution
    ? org.id
    : (existing?.commissionAttributionOrgId ?? null);
  const attributionJoinedAt = isFirstCommissionAttribution
    ? effectiveJoinedAt
    : (existing?.commissionAttributionJoinedAt ?? null);

  let commissionEligible: boolean | undefined;
  let commissionIneligibleReason: string | null | undefined;

  const shouldEvaluateCommissionEligibility =
    org.billingMode === "CLUB_PAY" || org.commissionRate > 0;
  if (shouldEvaluateCommissionEligibility && !existing?.commissionEligibleAdminOverride) {
    const eligibility = await resolveCommissionEligibilityForOrgJoin({
      userId: params.userId,
      email: existing?.email ?? "",
      orgJoinedAt: effectiveJoinedAt,
      orgBillingMode: org.billingMode,
      orgCommissionRate: org.commissionRate,
    });
    commissionEligible = eligibility.commissionEligible;
    commissionIneligibleReason = eligibility.commissionIneligibleReason;
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      organizationId: org.id,
      orgTeamId: teamId,
      orgJoinedAt: effectiveJoinedAt,
      orgTeamChangedAt: teamId ? joinedAt : null,
      commissionAttributionOrgId: attributionOrgId,
      commissionAttributionJoinedAt: attributionJoinedAt,
      ...(commissionEligible !== undefined ? { commissionEligible } : {}),
      ...(commissionIneligibleReason !== undefined ? { commissionIneligibleReason } : {}),
    },
  });

  return { ok: true as const, organization: org };
}

export type OrganizationAdminRecord = Organization & {
  codes: { id: string; code: string; label: string | null; active: boolean }[];
  teams: OrgTeam[];
  _count: { members: number };
};

export async function userNeedsInactiveOrgTeamReselection(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      orgTeamId: true,
      orgTeam: { select: { active: true } },
    },
  });
  if (!user?.organizationId || !user.orgTeamId) {
    return false;
  }
  return user.orgTeam?.active === false;
}
