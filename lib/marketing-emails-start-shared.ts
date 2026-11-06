/** ISO date or datetime in env MARKETING_EMAILS_START_AT; automated sequences only for records on/after this instant. */
export function getMarketingEmailsStartAt(): Date | null {
  const raw = process.env.MARKETING_EMAILS_START_AT?.trim();
  if (!raw) {
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function isOnOrAfterMarketingEmailsStart(instant: Date): boolean {
  const start = getMarketingEmailsStartAt();
  if (!start) {
    return true;
  }
  return instant.getTime() >= start.getTime();
}

export function isBeforeMarketingEmailsStart(instant: Date): boolean {
  return !isOnOrAfterMarketingEmailsStart(instant);
}

/**
 * Free/BASIC post-breakdown follow-ups only if the coach response is newer than this instant.
 * Avoids first cron run sending stale day-2..10 emails for old breakdowns. Disabled when unset.
 */
export function getFollowupSequenceCutoff(): Date | null {
  const raw = process.env.MARKETING_FOLLOWUP_CUTOFF_AT?.trim();
  if (!raw) {
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

const DEFAULT_ORG_TRIAL_REMINDER_MAX_SIGNUP_AGE_DAYS = 30;

/** Minimum signup age (days) for org-trial submit reminder; defaults to 30. */
export function getOrgTrialReminderMaxSignupAgeDays(): number {
  const raw = process.env.MARKETING_ORG_TRIAL_REMINDER_MAX_SIGNUP_AGE_DAYS?.trim();
  if (!raw) {
    return DEFAULT_ORG_TRIAL_REMINDER_MAX_SIGNUP_AGE_DAYS;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_ORG_TRIAL_REMINDER_MAX_SIGNUP_AGE_DAYS;
  }
  return n;
}
