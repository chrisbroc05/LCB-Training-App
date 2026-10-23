import "server-only";

import {
  canAccessDrillLibraryBrowse,
  canViewPlaybook,
} from "@/lib/access-shared";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
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
    select: userAccessSelect,
  });

  const access = user
    ? toAccessUserFields(user)
    : toAccessUserFields({
        membershipTier: "FREE",
        playbookLegacyAccess: false,
        membershipLevel: null,
        membershipLevelExpiresAt: null,
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
