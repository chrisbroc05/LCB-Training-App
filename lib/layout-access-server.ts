import "server-only";

import {
  canAccessDrillLibraryBrowse,
  canMessageCoach,
  canViewPlaybook,
  hasPersonalProgramDashboard,
  resolveEffectiveLevel,
} from "@/lib/access-shared";
import { mergeOrgIntoAccessFields } from "@/lib/org-server";
import { canAccessMemberDownloadsPage, type DatabaseTier } from "@/lib/membership";
import { formatMemberPlanLabel } from "@/lib/member-plan-labels-shared";
import { formatChicagoTrialEndLabel } from "@/lib/org-trial-dates-shared";
import { prisma } from "@/lib/prisma";

export type OrgTrialHeaderSummary = {
  orgName: string;
  endLabel: string | null;
  teamName: string | null;
};

export type LoggedInLayoutAccess = {
  membershipTier: DatabaseTier;
  playbookLegacyAccess: boolean;
  currentPlanLabel: string;
  hasDrillLibraryAccess: boolean;
  hasPlaybookAccess: boolean;
  hasMemberDownloadsAccess: boolean;
  hasProgramEnrollment: boolean;
  hasCoachingAccess: boolean;
  isOrgTrial: boolean;
  orgTrialHeader: OrgTrialHeaderSummary | null;
};

export async function loadLoggedInLayoutAccess(userId: string): Promise<LoggedInLayoutAccess> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membershipTier: true,
      membershipLevel: true,
      membershipLevelExpiresAt: true,
      playbookLegacyAccess: true,
      organizationId: true,
      orgTrialQuickReportUsed: true,
      coreQuickReportNextEligibleAt: true,
      organization: {
        select: {
          active: true,
          name: true,
          billingMode: true,
          coveredLevel: true,
          trialStartsAt: true,
          trialEndsAt: true,
        },
      },
      orgTeam: { select: { id: true, name: true, active: true } },
    },
  });

  const access = user
    ? mergeOrgIntoAccessFields(user)
    : mergeOrgIntoAccessFields({
        membershipTier: "FREE",
        membershipLevel: null,
        membershipLevelExpiresAt: null,
        playbookLegacyAccess: false,
        organizationId: null,
        orgTrialQuickReportUsed: false,
        coreQuickReportNextEligibleAt: null,
        organization: null,
      });

  let hasProgramEnrollment = false;
  if (hasPersonalProgramDashboard(access)) {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: { userId },
      select: { id: true },
    });
    hasProgramEnrollment = Boolean(enrollment);
  }

  const isOrgTrial = resolveEffectiveLevel(access) === "ORG_TRIAL";
  const orgTrialHeader = isOrgTrial
    ? {
        orgName: access.orgName?.trim() || user?.organization?.name || "Your organization",
        endLabel: formatChicagoTrialEndLabel(access.orgTrialEndsAt ?? null),
        teamName: access.orgTeamName ?? user?.orgTeam?.name ?? null,
      }
    : null;

  return {
    membershipTier: access.membershipTier,
    playbookLegacyAccess: access.playbookLegacyAccess,
    currentPlanLabel: formatMemberPlanLabel(access),
    hasDrillLibraryAccess: canAccessDrillLibraryBrowse(access),
    hasPlaybookAccess: canViewPlaybook(access),
    hasMemberDownloadsAccess: canAccessMemberDownloadsPage(access.membershipTier),
    hasProgramEnrollment,
    hasCoachingAccess: canMessageCoach(access),
    isOrgTrial,
    orgTrialHeader,
  };
}
