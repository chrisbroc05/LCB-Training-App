import { isMembershipLevelKey, type MembershipLevelKey } from "@/lib/membership-levels-shared";

export const MEMBERSHIP_CHECKOUT_QUERY_VALUE = "membership";

export type MembershipCheckoutIntent = {
  level: MembershipLevelKey;
  orgCode: string | null;
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
  return {
    level: levelRaw,
    orgCode: orgRaw || null,
  };
}

export function buildMembershipCheckoutAuthHref(
  level: MembershipLevelKey,
  options?: { mode?: "login" | "signup"; orgCode?: string | null },
): string {
  const params = new URLSearchParams({
    checkout: MEMBERSHIP_CHECKOUT_QUERY_VALUE,
    level: level.toLowerCase(),
  });
  if (options?.mode) {
    params.set("mode", options.mode);
  }
  if (options?.orgCode?.trim()) {
    params.set("orgCode", options.orgCode.trim());
  }
  return `/auth?${params.toString()}`;
}

export const MEMBERSHIP_COMPLETE_CHECKOUT_PATH = "/upgrade/complete-checkout";
