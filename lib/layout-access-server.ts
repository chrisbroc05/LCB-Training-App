import "server-only";

import {
  canAccessDrillLibraryBrowse,
  canViewPlaybook,
} from "@/lib/access-shared";
import { mergeOrgIntoAccessFields } from "@/lib/org-server";
import { canAccessMemberDownloadsPage, type DatabaseTier } from "@/lib/membership";
import { formatMemberPlanLabel } from "@/lib/member-plan-labels-shared";
import { prisma } from "@/lib/prisma";

export type LoggedInLayoutAccess = {
  membershipTier: DatabaseTier;
  playbookLegacyAccess: boolean;
  currentPlanLabel: string;
  hasDrillLibraryAccess: boolean;
  hasPlaybookAccess: boolean;
  hasMemberDownloadsAccess: boolean;
  hasProgramEnrollment: boolean;
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
          billingMode: true,
          coveredLevel: true,
          trialStartsAt: true,
          trialEndsAt: true,
        },
      },
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
  if (access.membershipTier === "TWELVE_WEEK") {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: { userId },
      select: { id: true },
    });
    hasProgramEnrollment = Boolean(enrollment);
  }

  return {
    membershipTier: access.membershipTier,
    playbookLegacyAccess: access.playbookLegacyAccess,
    currentPlanLabel: formatMemberPlanLabel(access),
    hasDrillLibraryAccess: canAccessDrillLibraryBrowse(access),
    hasPlaybookAccess: canViewPlaybook(access),
    hasMemberDownloadsAccess: canAccessMemberDownloadsPage(access.membershipTier),
    hasProgramEnrollment,
  };
}
