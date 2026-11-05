import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";

/** Hero "See Plans" and nav "Plans" when membership tiers are public; otherwise the 12-week program page. */
export function getHomepagePlansHref(): string {
  return isPublicMembershipLevelsEnabled() ? "/#plans" : "/program";
}
