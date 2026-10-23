import { PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL } from "@/lib/membership-levels-shared";
import { PLAYBOOK_NAME } from "@/lib/playbook-branding";

export function getMobileTrainTabLockedMessage() {
  return `${PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} Unlock training videos and the drill library.`;
}

export function getMobilePlaybookTabLockedMessage() {
  return `${PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} ${PLAYBOOK_NAME} is included with Plus and above.`;
}

export function getMobileResourcesTabLockedMessage() {
  return `${PUBLIC_MEMBERSHIP_UPGRADE_GENERIC_LABEL} Unlock downloadable guides and programs.`;
}
