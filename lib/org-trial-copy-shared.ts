/** Default org trial benefit copy (client-safe). */

import { ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL } from "@/lib/org-trial-unlock-copy-shared";

export const DEFAULT_ORG_TRIAL_INCLUDES_LINE =
  "Starter drills, one swing report during the trial, and coach-picked drills after your report.";

export function getOrgTrialIncludesLine(): string {
  return DEFAULT_ORG_TRIAL_INCLUDES_LINE;
}

export const ORG_TRIAL_PLAYBOOK_UNLOCK_LINE = ORG_TRIAL_JANUARY_UNLOCK_PLUS_LABEL;

export function getOrgTrialPlaybookUnlockLine(_orgTrialLockedCopy?: string | null): string {
  return ORG_TRIAL_PLAYBOOK_UNLOCK_LINE;
}
