import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { expirePastDueMembershipGraceForUser } from "@/lib/membership-subscription-grace-server";
import {
  resolveMembershipPaymentBannerContent,
  type MembershipPaymentBannerContent,
} from "@/lib/membership-payment-banner-shared";
import { MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS } from "@/lib/membership-subscription-shared";

export type MembershipPaymentBanner = MembershipPaymentBannerContent | null;

function graceEndFromNow(now: Date): Date {
  return new Date(now.getTime() + MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

export async function loadMembershipPaymentBanner(userId: string): Promise<MembershipPaymentBanner> {
  noStore();

  await expirePastDueMembershipGraceForUser(userId);

  let sub = await prisma.membershipSubscription.findUnique({
    where: { userId },
    select: { status: true, pastDueGraceEndsAt: true, level: true },
  });

  // Safety net only; invoice.payment_failed sets pastDueGraceEndsAt in handleMembershipInvoicePaymentFailed.
  if (sub?.status === "PAST_DUE" && !sub.pastDueGraceEndsAt) {
    const pastDueGraceEndsAt = graceEndFromNow(new Date());
    sub = await prisma.membershipSubscription.update({
      where: { userId },
      data: { pastDueGraceEndsAt },
      select: { status: true, pastDueGraceEndsAt: true, level: true },
    });
  }

  if (!sub) {
    return null;
  }

  return resolveMembershipPaymentBannerContent({
    status: sub.status,
    level: sub.level,
    pastDueGraceEndsAt: sub.pastDueGraceEndsAt,
  });
}
