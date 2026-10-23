import "server-only";

import {
  canAccessDrillLibraryBrowse,
  canViewDrill,
  getDrillLockedSurfaceMessage,
  hasFullDrillLibraryAccess,
  resolveEffectiveLevel,
  type AccessUserFields,
} from "@/lib/access-shared";
import { mergeDrillViewContext, toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { loadStarterDrillIdSet } from "@/lib/drill-library-catalog-server";
import { loadUserGrantedDrillIds } from "@/lib/drill-library-access-server";
import { getDrillLibraryVideoId, allDrillLibraryVideos } from "@/lib/drill-library-videos";
import { emptyAccessUserRow } from "@/lib/empty-access-user-shared";
import { prisma } from "@/lib/prisma";

export async function loadDrillLibraryAccessForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAccessSelect,
  });
  const access = user ? toAccessUserFields(user) : toAccessUserFields(emptyAccessUserRow);

  const canBrowseLibrary = canAccessDrillLibraryBrowse(access);
  const hasFullLibraryAccess = hasFullDrillLibraryAccess(access);
  const effectiveLevel = resolveEffectiveLevel(access);
  const lockedDrillMessage = getDrillLockedSurfaceMessage(access);
  const showProgramUpsell = effectiveLevel === "FREE" || effectiveLevel === "PLAYBOOK";

  const grantedDrillIds = canBrowseLibrary ? [] : await loadUserGrantedDrillIds(userId);
  const starterDrillIds = hasFullLibraryAccess ? new Set<string>() : await loadStarterDrillIdSet();

  const drillContext = mergeDrillViewContext(access, starterDrillIds, grantedDrillIds);

  const lockedDrillIds = hasFullLibraryAccess
    ? []
    : allDrillLibraryVideos
        .map((video) => getDrillLibraryVideoId(video))
        .filter((id): id is string => Boolean(id))
        .filter((id) => !canViewDrill(drillContext, id));

  return {
    access,
    canBrowseLibrary,
    hasFullLibraryAccess,
    effectiveLevel,
    lockedDrillMessage,
    showProgramUpsell,
    grantedDrillIds,
    lockedDrillIds,
    drillContext,
  };
}

export type DrillLibraryAccessContext = Awaited<ReturnType<typeof loadDrillLibraryAccessForUser>>;

export function accessFieldsForDrillEntitlements(access: AccessUserFields) {
  return {
    membershipTier: access.membershipTier,
    playbookLegacyAccess: access.playbookLegacyAccess,
    membershipLevel: access.membershipLevel,
    membershipLevelExpiresAt: access.membershipLevelExpiresAt,
  };
}
