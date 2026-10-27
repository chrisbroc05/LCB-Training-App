import "server-only";

import { prisma } from "@/lib/prisma";
import {
  MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS,
} from "@/lib/membership-subscription-shared";
import {
  syncUserDenormalizedFromSubscription,
} from "@/lib/membership-subscription-server";
import { expirePastDueMembershipGraceForUser } from "@/lib/membership-subscription-grace-server";

function graceEndFromNow(now: Date): Date {
  return new Date(now.getTime() + MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

/** Dev-only: same DB outcome as invoice.payment_failed for Phase 2A membership subs. */
export async function simulateMembershipRenewalPaymentFailed(userId: string) {
  const sub = await prisma.membershipSubscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new Error("No MembershipSubscription row for this user.");
  }

  const now = new Date();
  const pastDueGraceEndsAt = sub.pastDueGraceEndsAt ?? graceEndFromNow(now);

  const updated = await prisma.membershipSubscription.update({
    where: { userId },
    data: {
      status: "PAST_DUE",
      pastDueGraceEndsAt,
    },
  });

  await syncUserDenormalizedFromSubscription(userId, {
    level: updated.level,
    status: updated.status,
    currentPeriodEnd: updated.currentPeriodEnd,
    cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
    stripeCustomerId: updated.stripeCustomerId,
    stripeSubscriptionId: updated.stripeSubscriptionId,
    stripePriceId: updated.stripePriceId,
    pastDueGraceEndsAt: updated.pastDueGraceEndsAt,
  });

  return { pastDueGraceEndsAt: pastDueGraceEndsAt.toISOString() };
}

/** Dev-only: end grace immediately (drop to base tier in app). */
export async function expireMembershipGraceNow(userId: string) {
  const ok = await expirePastDueMembershipGraceForUser(userId, new Date());
  if (!ok) {
    throw new Error("User is not in PAST_DUE grace (or grace already ended).");
  }
  return { success: true };
}
