import "server-only";

import { prisma } from "@/lib/prisma";
import { expirePastDueMembershipGraceForUser } from "@/lib/membership-subscription-grace-server";
import { formatMembershipBillingDate } from "@/lib/format-date";

export type MembershipPaymentBanner = {
  graceEndsLabel: string;
} | null;

export async function loadMembershipPaymentBanner(userId: string): Promise<MembershipPaymentBanner> {
  await expirePastDueMembershipGraceForUser(userId);

  const sub = await prisma.membershipSubscription.findUnique({
    where: { userId },
    select: { status: true, pastDueGraceEndsAt: true },
  });

  if (sub?.status !== "PAST_DUE" || !sub.pastDueGraceEndsAt) {
    return null;
  }

  if (sub.pastDueGraceEndsAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    graceEndsLabel: formatMembershipBillingDate(sub.pastDueGraceEndsAt, "soon"),
  };
}
