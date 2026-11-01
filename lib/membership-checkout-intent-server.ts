import "server-only";

import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import {
  isMembershipCheckoutIntentExpired,
  membershipCheckoutIntentStillActive,
} from "@/lib/membership-checkout-intent-shared";
import { isMembershipLevelKey } from "@/lib/membership-levels-shared";
import { prisma } from "@/lib/prisma";

export async function saveMembershipCheckoutIntent(params: {
  userId: string;
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
}) {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      pendingCheckoutLevel: params.level,
      pendingCheckoutBillingInterval: params.billingInterval,
      pendingCheckoutAt: new Date(),
    },
  });
}

export async function clearMembershipCheckoutIntent(userId: string) {
  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      pendingCheckoutLevel: null,
      pendingCheckoutBillingInterval: null,
      pendingCheckoutAt: null,
    },
  });
}

export async function expireStaleMembershipCheckoutIntent(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pendingCheckoutLevel: true,
      pendingCheckoutAt: true,
    },
  });
  if (
    user?.pendingCheckoutLevel &&
    isMembershipCheckoutIntentExpired(user.pendingCheckoutAt)
  ) {
    await clearMembershipCheckoutIntent(userId);
  }
}

/** Read pending intent and clear it (one handoff to complete-checkout / Stripe). */
export async function consumeMembershipCheckoutIntent(userId: string): Promise<{
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pendingCheckoutLevel: true,
      pendingCheckoutBillingInterval: true,
      pendingCheckoutAt: true,
    },
  });

  if (
    !membershipCheckoutIntentStillActive({
      pendingCheckoutLevel: user?.pendingCheckoutLevel as MembershipLevelKey | null,
      pendingCheckoutAt: user?.pendingCheckoutAt,
    })
  ) {
    if (user?.pendingCheckoutLevel) {
      await clearMembershipCheckoutIntent(userId);
    }
    return null;
  }

  const level = user!.pendingCheckoutLevel!;
  if (!isMembershipLevelKey(level)) {
    await clearMembershipCheckoutIntent(userId);
    return null;
  }

  const billingInterval =
    (user!.pendingCheckoutBillingInterval as MembershipBillingIntervalKey | null) ?? "MONTHLY";

  await clearMembershipCheckoutIntent(userId);

  return { level, billingInterval };
}
