import { formatDateWithYear } from "@/lib/format-date";

export const EXTRA_REVIEW_PRICE_DISPLAY = "$40";
export const EXTRA_REVIEW_USE_WINDOW_DAYS = 30;
export const EXTRA_REVIEW_MAX_PER_WEEK = 1;
export const EXTRA_REVIEW_MAX_PER_MONTH = 2;

export const EXTRA_REVIEW_OFFER_HEADLINE =
  "Need another one? Get an extra in-depth review for $40.";

export const EXTRA_REVIEW_WEEKLY_LIMIT_COPY = "You can get 1 extra review per week.";
export const EXTRA_REVIEW_MONTHLY_LIMIT_COPY = "You can buy up to 2 extra reviews per month.";

export function extraReviewExpiresAt(from: Date = new Date()): Date {
  const expires = new Date(from);
  expires.setUTCDate(expires.getUTCDate() + EXTRA_REVIEW_USE_WINDOW_DAYS);
  return expires;
}

/** Chicago calendar week start (Monday 00:00 America/Chicago) approximated via UTC-6 fixed offset for tests. */
export function chicagoWeekKey(date: Date): string {
  const chicago = new Date(date.getTime() - 6 * 60 * 60 * 1000);
  const day = chicago.getUTCDay();
  const mondayOffset = (day + 6) % 7;
  chicago.setUTCDate(chicago.getUTCDate() - mondayOffset);
  return chicago.toISOString().slice(0, 10);
}

export function chicagoMonthKey(date: Date): string {
  const chicago = new Date(date.getTime() - 6 * 60 * 60 * 1000);
  return `${chicago.getUTCFullYear()}-${String(chicago.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Instant for the first moment of the next Chicago calendar month (for display). */
export function nextChicagoCalendarMonthStart(now: Date = new Date()): Date {
  const key = chicagoMonthKey(now);
  const [year, month] = key.split("-").map(Number);
  let nextYear = year!;
  let nextMonth = month! + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  return new Date(Date.UTC(nextYear, nextMonth - 1, 1, 6, 0, 0));
}

export function formatPlusMonthlyReviewNextAvailableMessage(now: Date = new Date()): string {
  return `Your next monthly review is available ${formatDateWithYear(nextChicagoCalendarMonthStart(now))}.`;
}

export function chicagoWeekStartInstant(now: Date = new Date()): Date {
  const weekKey = chicagoWeekKey(now);
  return new Date(`${weekKey}T06:00:00.000Z`);
}

export function nextChicagoWeekStartInstant(now: Date = new Date()): Date {
  const start = chicagoWeekStartInstant(now);
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

export function nextChicagoCalendarMonthStartInstant(now: Date = new Date()): Date {
  return nextChicagoCalendarMonthStart(now);
}

export type ExtraReviewPurchaseBlockReason = "week" | "month" | null;

export function formatUnusedExtraReviewCreditsMessage(params: {
  count: number;
  useByDate: Date | string | null | undefined;
}): string {
  if (params.count <= 0) {
    return "";
  }
  const useByLabel = params.useByDate ? formatDateWithYear(params.useByDate) : "the expiration date";
  if (params.count === 1) {
    return `You have 1 extra review. Use it by ${useByLabel}.`;
  }
  return `You have ${params.count} extra reviews. Use the oldest by ${useByLabel}.`;
}

export function buildExtraReviewPurchaseBlockedMessage(params: {
  reason: ExtraReviewPurchaseBlockReason;
  nextEligibleAt: Date | null;
}): string {
  if (params.reason === "week") {
    const when = params.nextEligibleAt
      ? formatDateWithYear(params.nextEligibleAt)
      : "next week";
    return `${EXTRA_REVIEW_WEEKLY_LIMIT_COPY} You can buy the next one on ${when}.`;
  }
  if (params.reason === "month") {
    const when = params.nextEligibleAt
      ? formatDateWithYear(params.nextEligibleAt)
      : "next month";
    return `${EXTRA_REVIEW_MONTHLY_LIMIT_COPY} You can buy again on ${when}.`;
  }
  return "";
}
