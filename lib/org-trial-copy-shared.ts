/** Default org trial benefit copy (client-safe). */

export const DEFAULT_ORG_TRIAL_INCLUDES_LINE =
  "Starter drills, one swing report during the trial, and coach-picked drills after your report.";

export function getOrgTrialIncludesLine(): string {
  return DEFAULT_ORG_TRIAL_INCLUDES_LINE;
}

export const ORG_TRIAL_PLAYBOOK_UNLOCK_LINE =
  "The full Playbook unlocks in January. Your club's members get it with Plus.";

export function getOrgTrialPlaybookUnlockLine(orgTrialLockedCopy?: string | null): string {
  const custom = orgTrialLockedCopy?.trim();
  return custom || ORG_TRIAL_PLAYBOOK_UNLOCK_LINE;
}
