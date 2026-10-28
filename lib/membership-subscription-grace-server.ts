import "server-only";

import type { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildMembershipSubscriptionGraceExpiryUpdate,
} from "@/lib/membership-subscription-shared";
import { syncUserDenormalizedFromSubscription } from "@/lib/membership-subscription-server";

export async function expirePastDueMembershipGraceForUser(userId: string, now = new Date()) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== "PAST_DUE" || !sub.pastDueGraceEndsAt) {
    return false;
  }
  if (sub.pastDueGraceEndsAt.getTime() > now.getTime()) {
    return false;
  }

  const expiryUpdate = buildMembershipSubscriptionGraceExpiryUpdate(sub.pastDueGraceEndsAt, now);

  const updated = await prisma.membershipSubscription.update({
    where: { userId },
    data: expiryUpdate,
  });

  await syncUserDenormalizedFromSubscription(userId, {
    level: updated.level,
    status: updated.status as SubscriptionStatus,
    currentPeriodEnd: updated.currentPeriodEnd,
    cancelAtPeriodEnd: false,
    stripeCustomerId: updated.stripeCustomerId,
    stripeSubscriptionId: updated.stripeSubscriptionId,
    stripePriceId: updated.stripePriceId,
    pastDueGraceEndsAt: updated.pastDueGraceEndsAt,
  });

  return true;
}
