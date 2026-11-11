import "server-only";

import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import {
  adminMemberDetailSelect,
  serializeAdminMemberDetail,
} from "@/lib/admin-members";
import { loadMemberDailyChallengeStats } from "@/lib/daily-challenge-server";
import { syncMembershipSubscriptionPaymentsFromStripe } from "@/lib/membership-subscription-server";
import { prisma } from "@/lib/prisma";

export async function loadAdminMemberDetailSerialized(userId: string) {
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: adminMemberDetailSelect,
  });

  if (!member) {
    return null;
  }

  let membershipPayments: Array<{
    id: string;
    billingInterval: "MONTHLY" | "ANNUAL" | null;
    amountPaidCents: number;
    paidAt: Date;
    annualRefundEligibleUntil: Date | null;
    refundedAt: Date | null;
  }> = [];

  if (member.membershipSubscription) {
    await syncMembershipSubscriptionPaymentsFromStripe({
      userId: member.id,
      stripeCustomerId: member.stripeCustomerId,
      stripeSubscriptionId: member.membershipSubscription.stripeSubscriptionId,
      subscriptionBillingInterval:
        member.membershipSubscription.billingInterval as MembershipBillingIntervalKey,
    });

    membershipPayments = await prisma.membershipSubscriptionPayment.findMany({
      where: {
        OR: [
          { userId: member.id },
          { membershipSubscriptionId: member.membershipSubscription.id },
        ],
      },
      orderBy: { paidAt: "desc" },
      select: {
        id: true,
        billingInterval: true,
        amountPaidCents: true,
        paidAt: true,
        annualRefundEligibleUntil: true,
        refundedAt: true,
      },
    });
  }

  const [detail, challengeStats] = await Promise.all([
    Promise.resolve(serializeAdminMemberDetail(member, membershipPayments)),
    loadMemberDailyChallengeStats(userId),
  ]);

  return {
    ...detail,
    dailyChallenge: {
      completedAllTime: challengeStats.completedAllTime,
      completedThisMonth: challengeStats.completedThisMonth,
      currentStreak: challengeStats.streak,
      longestStreak: challengeStats.longestStreak,
    },
  };
}
