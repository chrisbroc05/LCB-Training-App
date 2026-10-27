import "server-only";

import { isMembershipLevelKey } from "@/lib/membership-levels-shared";
import { MEMBERSHIP_COMPLETE_CHECKOUT_PATH } from "@/lib/membership-checkout-intent-shared";
import { prisma } from "@/lib/prisma";
import { getPostAuthRedirectPath } from "@/lib/free-swing-flow";

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipTier: true, membershipLevel: true, pendingCheckoutLevel: true },
  });

  if (
    user?.pendingCheckoutLevel &&
    isMembershipLevelKey(user.pendingCheckoutLevel)
  ) {
    return MEMBERSHIP_COMPLETE_CHECKOUT_PATH;
  }

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

  return getPostAuthRedirectPath(redirectParam, callbackUrlParam);
}
