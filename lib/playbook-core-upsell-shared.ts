import { isPublicMembershipLevelsEnabled } from "@/lib/membership-levels-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";

export const PLAYBOOK_CORE_PLUS_UPSELL_TITLE = "Get it with Plus";

export const PLAYBOOK_CORE_PLUS_UPSELL_DESCRIPTION =
  "The Playbook, full drill library, a monthly video review, and messaging. $20/mo.";

export const PLAYBOOK_CORE_ONE_TIME_BUTTON_LABEL = "Buy the Playbook - $59";

export function shouldShowPlaybookCorePlusUpsell(
  membershipLevel: MembershipLevelKey | null | undefined,
): boolean {
  return isPublicMembershipLevelsEnabled() && membershipLevel === "CORE";
}
