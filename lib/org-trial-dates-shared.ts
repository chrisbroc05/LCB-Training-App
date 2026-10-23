/**
 * Organization trial calendar dates in America/Chicago (inclusive start and end days).
 */

const CHICAGO_TZ = "America/Chicago";

type ChicagoParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function readChicagoCalendarYmd(instant: Date) {
  const parts = readChicagoParts(instant);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function readChicagoParts(instant: Date): ChicagoParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(instant);
  const read = (type: string) => Number(parts.find((entry) => entry.type === type)?.value ?? "0");
  let hour = read("hour");
  if (hour === 24) {
    hour = 0;
  }
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
    second: read("second"),
  };
}

function addCalendarDays(year: number, month: number, day: number, delta: number) {
  const cursor = new Date(Date.UTC(year, month - 1, day + delta, 12, 0, 0, 0));
  return {
    year: cursor.getUTCFullYear(),
    month: cursor.getUTCMonth() + 1,
    day: cursor.getUTCDate(),
  };
}

export function chicagoStartOfCalendarDay(year: number, month: number, day: number): Date {
  const base = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  for (let offsetHours = -18; offsetHours <= 18; offsetHours += 1) {
    const candidate = new Date(base + offsetHours * 60 * 60 * 1000);
    const parts = readChicagoParts(candidate);
    if (
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === 0 &&
      parts.minute === 0
    ) {
      return candidate;
    }
  }
  return new Date(base);
}

export function chicagoEndOfCalendarDay(year: number, month: number, day: number): Date {
  const next = addCalendarDays(year, month, day, 1);
  return new Date(chicagoStartOfCalendarDay(next.year, next.month, next.day).getTime() - 1);
}

export function parseChicagoDateInput(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return { year, month, day };
}

export function trialStartInstantFromDateInput(value: string): Date | null {
  const parsed = parseChicagoDateInput(value);
  if (!parsed) {
    return null;
  }
  return chicagoStartOfCalendarDay(parsed.year, parsed.month, parsed.day);
}

export function trialEndInstantFromDateInput(value: string): Date | null {
  const parsed = parseChicagoDateInput(value);
  if (!parsed) {
    return null;
  }
  return chicagoEndOfCalendarDay(parsed.year, parsed.month, parsed.day);
}

export function formatChicagoDateInputValue(instant: Date | string | null | undefined): string {
  if (!instant) {
    return "";
  }
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const parts = readChicagoParts(date);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

export function isOrgTrialWindowActive(
  trialStartsAt: Date | string | null | undefined,
  trialEndsAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  if (!trialStartsAt || !trialEndsAt) {
    return false;
  }
  const start = trialStartsAt instanceof Date ? trialStartsAt : new Date(trialStartsAt);
  const end = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }
  const t = now.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function formatChicagoTrialEndLabel(
  trialEndsAt: Date | string | null | undefined,
): string | null {
  if (!trialEndsAt) {
    return null;
  }
  const end = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) {
    return null;
  }
  const parts = readChicagoParts(end);
  const display = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0));
  return display.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
