import {
  isPublicMembershipLevelsEnabled,
  PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL,
} from "@/lib/membership-levels-shared";
import { ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL } from "@/lib/org-trial-unlock-copy-shared";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";

export function getMobileTrainTabLockedMessage() {
  return `${PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} Unlock training videos and the drill library.`;
}

export function getMobilePlaybookTabLockedMessage(isOrgTrial = false) {
  if (isOrgTrial) {
    return ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL;
  }
  if (isPublicMembershipLevelsEnabled()) {
    return `${PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} ${PLAYBOOK_NAME} is included with Plus and above.`;
  }
  return `${PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} Unlock ${PLAYBOOK_NAME} on the Playbook page.`;
}

export function getMobileResourcesTabLockedMessage() {
  return `${PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} Unlock downloadable guides and programs.`;
}
