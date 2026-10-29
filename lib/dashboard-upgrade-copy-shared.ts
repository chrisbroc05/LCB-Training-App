import {
  isPublicMembershipLevelsEnabled,
  MEMBERSHIP_LEVELS,
  type MembershipLevelKey,
} from "@/lib/membership-levels-shared";
import { activeMembershipLevel, resolveEffectiveLevel, type AccessUserFields } from "@/lib/access-shared";
import { TWELVE_WEEK_PROGRAM_PRICE_LABEL } from "@/lib/twelve-week-program";

export const TWELVE_WEEK_DASHBOARD_UPSELL_COPY =
  "A personalized daily plan, a weekly video breakdown from me, direct messaging, and a kickoff call with you and a parent.";

export const TWELVE_WEEK_DASHBOARD_UPSELL_PRICE = `${TWELVE_WEEK_PROGRAM_PRICE_LABEL} one time.`;

export type DashboardLevelUpSuggestion = {
  title: string;
  body: string;
  href: string;
  buttonLabel: string;
};

export function getDashboardLevelUpSuggestion(
  user: AccessUserFields,
  now = new Date(),
): DashboardLevelUpSuggestion | null {
  if (!isPublicMembershipLevelsEnabled()) {
    return null;
  }
  const level = activeMembershipLevel(user, now);
  const effective = resolveEffectiveLevel(user, now);

  if (effective === "FREE" || (!level && user.membershipTier === "FREE")) {
    return {
      title: `Upgrade to ${MEMBERSHIP_LEVELS.CORE.displayName}`,
      body: `${MEMBERSHIP_LEVELS.CORE.shortDescription} Or compare ${MEMBERSHIP_LEVELS.PLUS.displayName}.`,
      href: "/upgrade",
      buttonLabel: "See membership levels",
    };
  }

  if (level === "CORE") {
    return {
      title: `Upgrade to ${MEMBERSHIP_LEVELS.PLUS.displayName}`,
      body: `${MEMBERSHIP_LEVELS.PLUS.shortDescription} ${MEMBERSHIP_LEVELS.PLUS.priceDisplay}. Or compare ${MEMBERSHIP_LEVELS.ALL_ACCESS.displayName}.`,
      href: "/settings",
      buttonLabel: `Get ${MEMBERSHIP_LEVELS.PLUS.displayName}`,
    };
  }

  if (level === "PLUS") {
    return {
      title: `Upgrade to ${MEMBERSHIP_LEVELS.ALL_ACCESS.displayName}`,
      body: `${MEMBERSHIP_LEVELS.ALL_ACCESS.shortDescription} ${MEMBERSHIP_LEVELS.ALL_ACCESS.priceDisplay}.`,
      href: "/settings",
      buttonLabel: `Get ${MEMBERSHIP_LEVELS.ALL_ACCESS.displayName}`,
    };
  }

  return null;
}

export function shouldShowTwelveWeekDashboardUpsell(user: AccessUserFields, now = new Date()): boolean {
  const effective = resolveEffectiveLevel(user, now);
  return (
    effective === "FREE" ||
    effective === "PLAYBOOK" ||
    effective === "CORE" ||
    user.membershipTier === "BASIC"
  );
}
