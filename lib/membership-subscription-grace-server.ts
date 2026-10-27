import "server-only";

import { prisma } from "@/lib/prisma";
import { syncUserDenormalizedFromSubscription } from "@/lib/membership-subscription-server";

export async function expirePastDueMembershipGraceForUser(userId: string, now = new Date()) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== "PAST_DUE" || !sub.pastDueGraceEndsAt) {
    return false;
  }
  if (sub.pastDueGraceEndsAt.getTime() > now.getTime()) {
    return false;
  }

  await prisma.membershipSubscription.delete({ where: { userId } }).catch(() => null);

  await syncUserDenormalizedFromSubscription(userId, {
    level: sub.level,
    status: "CANCELED",
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: false,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    stripePriceId: sub.stripePriceId,
    pastDueGraceEndsAt: null,
  });

  return true;
}
