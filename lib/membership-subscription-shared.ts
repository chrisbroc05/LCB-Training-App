import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

export const MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS = 7;

export const MEMBERSHIP_LEVEL_RANK: Record<MembershipLevelKey, number> = {
  CORE: 1,
  PLUS: 2,
  ALL_ACCESS: 3,
};

export function compareMembershipLevels(a: MembershipLevelKey, b: MembershipLevelKey): number {
  return MEMBERSHIP_LEVEL_RANK[a] - MEMBERSHIP_LEVEL_RANK[b];
}

export function isMembershipLevelUpgrade(
  from: MembershipLevelKey,
  to: MembershipLevelKey,
): boolean {
  return compareMembershipLevels(to, from) > 0;
}

export function isMembershipLevelDowngrade(
  from: MembershipLevelKey,
  to: MembershipLevelKey,
): boolean {
  return compareMembershipLevels(to, from) < 0;
}

export type MembershipSubscriptionStripeMetadata = {
  userId: string;
  membershipLevel: MembershipLevelKey;
  organizationId?: string;
  orgJoinedAt?: string;
};

export function parseMembershipLevelFromMetadata(
  value: string | null | undefined,
): MembershipLevelKey | null {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "CORE" || normalized === "PLUS" || normalized === "ALL_ACCESS") {
    return normalized;
  }
  return null;
}

export function mapStripeSubscriptionStatus(params: {
  stripeStatus: string;
  cancelAtPeriodEnd: boolean;
  deleted: boolean;
  pastDueGraceEndsAt: Date | null;
  now?: Date;
}): "NONE" | "ACTIVE" | "CANCEL_AT_PERIOD_END" | "CANCELED" | "PAST_DUE" {
  if (
    params.deleted ||
    params.stripeStatus === "canceled" ||
    params.stripeStatus === "incomplete_expired"
  ) {
    return "CANCELED";
  }
  if (params.stripeStatus === "past_due" || params.stripeStatus === "unpaid") {
    const now = params.now ?? new Date();
    if (params.pastDueGraceEndsAt && params.pastDueGraceEndsAt.getTime() > now.getTime()) {
      return "PAST_DUE";
    }
    if (params.pastDueGraceEndsAt && params.pastDueGraceEndsAt.getTime() <= now.getTime()) {
      return "CANCELED";
    }
    return "PAST_DUE";
  }
  if (params.cancelAtPeriodEnd) {
    return "CANCEL_AT_PERIOD_END";
  }
  if (params.stripeStatus === "active" || params.stripeStatus === "trialing") {
    return "ACTIVE";
  }
  return "ACTIVE";
}

export function subscriptionStatusGrantsAccess(
  status: string,
  params: {
    now?: Date;
    currentPeriodEnd: Date | null;
    pastDueGraceEndsAt: Date | null;
  },
): boolean {
  const now = params.now ?? new Date();
  if (status === "ACTIVE" || status === "CANCEL_AT_PERIOD_END") {
    if (!params.currentPeriodEnd) {
      return status === "ACTIVE";
    }
    return params.currentPeriodEnd.getTime() > now.getTime();
  }
  if (status === "PAST_DUE") {
    if (params.pastDueGraceEndsAt) {
      return params.pastDueGraceEndsAt.getTime() > now.getTime();
    }
    return false;
  }
  return false;
}
