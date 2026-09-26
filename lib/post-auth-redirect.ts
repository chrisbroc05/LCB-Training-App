import "server-only";

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
    select: { membershipTier: true },
  });

  if (user?.membershipTier === "TWELVE_WEEK") {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: { userId },
      select: { onboardingCompletedAt: true },
    });

    if (!enrollment?.onboardingCompletedAt) {
      return "/program/start";
    }

    return "/dashboard";
  }

  return getPostAuthRedirectPath(redirectParam, callbackUrlParam);
}
