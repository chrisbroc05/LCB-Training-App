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
