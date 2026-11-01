import { parseMembershipBillingInterval, type MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import { isMembershipLevelKey, type MembershipLevelKey } from "@/lib/membership-levels-shared";

export const MEMBERSHIP_CHECKOUT_QUERY_VALUE = "membership";

export const MEMBERSHIP_CHECKOUT_CANCELED_QUERY = "canceled";

/** Pending checkout intents expire after 24 hours. */
export const MEMBERSHIP_CHECKOUT_INTENT_TTL_MS = 24 * 60 * 60 * 1000;

export type MembershipCheckoutIntent = {
  level: MembershipLevelKey;
  orgCode: string | null;
  billingInterval: MembershipBillingIntervalKey;
};

export function parseMembershipCheckoutIntent(
  searchParams: Pick<URLSearchParams, "get">,
): MembershipCheckoutIntent | null {
  if (searchParams.get("checkout") !== MEMBERSHIP_CHECKOUT_QUERY_VALUE) {
    return null;
  }

  const levelRaw = searchParams.get("level")?.trim().toUpperCase() ?? "";
  if (!isMembershipLevelKey(levelRaw)) {
    return null;
  }

  const orgRaw = searchParams.get("orgCode")?.trim();
  const billingInterval = parseMembershipBillingInterval(searchParams.get("billing"));
  return {
    level: levelRaw,
    orgCode: orgRaw || null,
    billingInterval,
  };
}

export function buildMembershipCheckoutAuthHref(
  level: MembershipLevelKey,
  options?: {
    mode?: "login" | "signup";
    orgCode?: string | null;
    billingInterval?: MembershipBillingIntervalKey;
  },
): string {
  const params = new URLSearchParams({
    checkout: MEMBERSHIP_CHECKOUT_QUERY_VALUE,
    level: level.toLowerCase(),
  });
  if (options?.billingInterval) {
    params.set("billing", options.billingInterval.toLowerCase());
  }
  if (options?.mode) {
    params.set("mode", options.mode);
  }
  if (options?.orgCode?.trim()) {
    params.set("orgCode", options.orgCode.trim());
  }
  return `/auth?${params.toString()}`;
}

export const MEMBERSHIP_COMPLETE_CHECKOUT_PATH = "/upgrade/complete-checkout";

export function isMembershipCheckoutIntentExpired(
  pendingCheckoutAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!pendingCheckoutAt) {
    return true;
  }
  return now.getTime() - pendingCheckoutAt.getTime() > MEMBERSHIP_CHECKOUT_INTENT_TTL_MS;
}

export function membershipCheckoutIntentStillActive(params: {
  pendingCheckoutLevel: MembershipLevelKey | null | undefined;
  pendingCheckoutAt: Date | null | undefined;
  now?: Date;
}): boolean {
  if (!params.pendingCheckoutLevel) {
    return false;
  }
  return !isMembershipCheckoutIntentExpired(params.pendingCheckoutAt, params.now);
}
