/** Max age for queued program notifications before first cron clears them (ms). Default 3 days. */
const DEFAULT_STALE_QUEUE_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

const DEFAULT_STALE_SETUP_REMINDER_DAYS = 30;

export function getProgramStaleSetupReminderMaxDays(): number {
  const raw = process.env.PROGRAM_STALE_SETUP_REMINDER_DAYS?.trim();
  if (!raw) {
    return DEFAULT_STALE_SETUP_REMINDER_DAYS;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_STALE_SETUP_REMINDER_DAYS;
  }
  return n;
}

export function getProgramCronStaleQueueMaxAgeMs(): number {
  const raw = process.env.PROGRAM_CRON_STALE_QUEUE_MAX_AGE_MS?.trim();
  if (!raw) {
    return DEFAULT_STALE_QUEUE_MAX_AGE_MS;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_STALE_QUEUE_MAX_AGE_MS;
  }
  return n;
}
