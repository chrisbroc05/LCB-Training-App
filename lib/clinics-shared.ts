/** Client-safe clinic signup helpers and copy. */

export const CLINIC_HOLD_MINUTES = 30;
export const CLINIC_HOLD_MS = CLINIC_HOLD_MINUTES * 60 * 1000;
export const CLINIC_SET_PASSWORD_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const CLINIC_PURCHASE_TYPE = "clinic";
export const CLINIC_LEAD_SOURCE = "Clinic";

export const CLINIC_DEFAULT_NAME = "Thanksgiving Break Infield Clinic";
export const CLINIC_DEFAULT_SLUG = "infield-clinic";

export const CLINIC_DEFAULT_REFUND_POLICY =
  "Full refund up to 48 hours before your clinic day. After that, we'll give you a credit toward a future clinic.";

export const CLINIC_SPORTS = ["BASEBALL", "SOFTBALL"] as const;
export type ClinicSportKey = (typeof CLINIC_SPORTS)[number];

export function isClinicSportKey(value: string): value is ClinicSportKey {
  return (CLINIC_SPORTS as readonly string[]).includes(value);
}

export function formatClinicSportLabel(sport: ClinicSportKey) {
  return sport === "BASEBALL" ? "Baseball" : "Softball";
}

export function formatClinicMoney(cents: number) {
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) {
    return `$${dollars}`;
  }
  return `$${dollars.toFixed(2)}`;
}

/**
 * All selected days always get the all-days price when the clinic has more than one day.
 * Callers can still pass isAllDaysBundle for recording; pricing does not depend on the flag alone.
 */
export function computeClinicAmountCents(params: {
  selectedDayCount: number;
  totalDayCount: number;
  pricePerDayCents: number;
  allDaysPriceCents: number;
  isAllDaysBundle?: boolean;
}) {
  if (params.selectedDayCount <= 0) {
    return 0;
  }
  if (params.selectedDayCount === params.totalDayCount && params.totalDayCount > 1) {
    return params.allDaysPriceCents;
  }
  return params.selectedDayCount * params.pricePerDayCents;
}

/** Calendar YYYY-MM-DD for a Prisma @db.Date or date key string (no timezone shift). */
export function clinicDateKey(date: Date | string) {
  if (typeof date === "string") {
    const trimmed = date.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return clinicDateKey(parsed);
    }
    return trimmed.slice(0, 10);
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Format a clinic day as a calendar date only (never shift via America/Chicago). */
export function formatClinicDayLabel(date: Date | string) {
  const key = clinicDateKey(date);
  const [year, month, day] = key.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return key;
  }
  const value = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatClinicClockLabel(timeLocal: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeLocal.trim());
  if (!match) {
    return timeLocal.trim();
  }
  let hour = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return timeLocal.trim();
  }
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) {
    hour = 12;
  }
  return `${hour}:${minute} ${suffix}`;
}

export function formatClinicTimeRange(startTimeLocal: string, endTimeLocal: string) {
  return `${formatClinicClockLabel(startTimeLocal)} - ${formatClinicClockLabel(endTimeLocal)}`;
}

export function slugifyClinicName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "clinic";
}

export type ClinicDayAvailability = {
  dayId: string;
  dateKey: string;
  dateLabel: string;
  capacity: number;
  taken: number;
  spotsLeft: number;
  soldOut: boolean;
};

export function clinicOverallSoldOut(days: ClinicDayAvailability[]) {
  return days.length > 0 && days.every((day) => day.soldOut);
}
