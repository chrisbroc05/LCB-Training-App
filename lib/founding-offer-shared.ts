import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

export type FoundingOfferOrgFields = {
  foundingOfferEnabled: boolean;
  foundingOfferDeadline: Date | null;
  foundingOfferMonths: number;
};

export function isFoundingOfferWindowOpen(
  org: FoundingOfferOrgFields,
  now: Date = new Date(),
): boolean {
  if (!org.foundingOfferEnabled) {
    return false;
  }
  if (!org.foundingOfferDeadline) {
    return false;
  }
  return now.getTime() <= org.foundingOfferDeadline.getTime();
}

/** Founding discount applies only to Plus monthly checkout or Core -> Plus monthly upgrade. */
export function shouldApplyFoundingPlusMonthlyOffer(params: {
  level: MembershipLevelKey;
  billingInterval: MembershipBillingIntervalKey;
  org: FoundingOfferOrgFields | null | undefined;
  now?: Date;
}): boolean {
  if (params.level !== "PLUS" || params.billingInterval !== "MONTHLY") {
    return false;
  }
  if (!params.org) {
    return false;
  }
  return isFoundingOfferWindowOpen(params.org, params.now);
}

export function foundingDiscountEndsAtFromMonths(start: Date, months: number): Date {
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  return end;
}

export const FOUNDING_PLUS_MONTHLY_DISCOUNT_DISPLAY =
  "$15/mo (founding price) for your first 12 months, then $20/mo";

export const FOUNDING_PLUS_MONTHLY_COACH_PRICE_LINE =
  "$15/mo founding price, $20/mo after 12 months";

export const FOUNDING_PRICE_ENDS_WITH_CHANGE_SENTENCE =
  "Your founding price ends with this change.";

export function isActiveFoundingPlusMonthlyMember(params: {
  level: string | null | undefined;
  billingInterval: string | null | undefined;
  foundingDiscountEndsAt: Date | string | null | undefined;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  if (params.level !== "PLUS" || params.billingInterval !== "MONTHLY") {
    return false;
  }
  if (!params.foundingDiscountEndsAt) {
    return false;
  }
  return new Date(params.foundingDiscountEndsAt).getTime() > now.getTime();
}

export function shouldEndFoundingPlusMonthlyOnPlanChange(params: {
  foundingActive: boolean;
  changeKind: "upgrade" | "downgrade" | "switch_to_annual" | "switch_to_monthly";
  targetLevel?: MembershipLevelKey;
}): boolean {
  if (!params.foundingActive) {
    return false;
  }
  if (params.changeKind === "switch_to_annual") {
    return true;
  }
  if (params.changeKind === "downgrade" && params.targetLevel === "CORE") {
    return true;
  }
  if (params.changeKind === "upgrade" && params.targetLevel === "ALL_ACCESS") {
    return true;
  }
  return false;
}

export function appendFoundingPriceEndsNotice(body: string, foundingEndsWithChange: boolean): string {
  if (!foundingEndsWithChange) {
    return body;
  }
  return `${body} ${FOUNDING_PRICE_ENDS_WITH_CHANGE_SENTENCE}`;
}
