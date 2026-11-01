import "server-only";

import { prisma } from "@/lib/prisma";
import { getPostAuthRedirectPath } from "@/lib/free-swing-flow";
import { expireStaleMembershipCheckoutIntent } from "@/lib/membership-checkout-intent-server";
import {
  buildOrgJoinLandingPath,
  buildOrgJoinWelcomePath,
  parseOrgJoinRedirectPath,
} from "@/lib/org-join-auth-shared";
import { findOrganizationByJoinCode } from "@/lib/org-server";

export async function clearStalePendingCheckout(userId: string) {
  await prisma.user.updateMany({
    where: {
      id: userId,
      pendingCheckoutTier: { not: null },
    },
    data: { pendingCheckoutTier: null },
  });
}

export async function resolvePostAuthDestination(
  userId: string,
  redirectParam: string | null,
  callbackUrlParam?: string | null,
) {
  await clearStalePendingCheckout(userId);
  await expireStaleMembershipCheckoutIntent(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipTier: true, membershipLevel: true },
  });

  if (user?.membershipLevel === "ALL_ACCESS") {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: { userId },
      select: { onboardingCompletedAt: true },
    });
    if (!enrollment?.onboardingCompletedAt) {
      return "/program/start";
    }
    return "/dashboard/today";
  }

  if (user?.membershipTier === "TWELVE_WEEK") {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: { userId },
      select: { onboardingCompletedAt: true },
    });

    if (!enrollment?.onboardingCompletedAt) {
      return "/program/start";
    }

    return "/dashboard/today";
  }

  const baseRedirect = getPostAuthRedirectPath(redirectParam, callbackUrlParam);
  const joinCode = parseOrgJoinRedirectPath(baseRedirect);
  if (!joinCode) {
    return baseRedirect;
  }

  const match = await findOrganizationByJoinCode(joinCode);
  if (!match) {
    return buildOrgJoinLandingPath(joinCode);
  }

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  if (member?.organizationId === match.organization.id) {
    return buildOrgJoinWelcomePath(joinCode);
  }

  return buildOrgJoinLandingPath(joinCode);
}
