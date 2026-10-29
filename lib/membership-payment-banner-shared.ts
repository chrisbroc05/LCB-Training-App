import { formatMembershipBillingDate } from "@/lib/format-date";
import {
  formatMembershipLevelLabel,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";
import { MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS } from "@/lib/membership-subscription-shared";

export type MembershipPaymentBannerContent = {
  levelLabel: string;
  graceEndsLabel: string;
};

function graceEndFromNow(now: Date): Date {
  return new Date(now.getTime() + MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

/** Pure banner resolution from MembershipSubscription fields (client-safe). */
export function resolveMembershipPaymentBannerContent(params: {
  status: string;
  level: string;
  pastDueGraceEndsAt: Date | null;
  now?: Date;
}): MembershipPaymentBannerContent | null {
  if (params.status !== "PAST_DUE") {
    return null;
  }

  const now = params.now ?? new Date();
  const graceEnd = params.pastDueGraceEndsAt ?? graceEndFromNow(now);
  if (graceEnd.getTime() <= now.getTime()) {
    return null;
  }

  const levelKey = params.level as MembershipLevelKey;
  return {
    levelLabel: formatMembershipLevelLabel(levelKey),
    graceEndsLabel: formatMembershipBillingDate(graceEnd),
  };
}
