export const CHICAGO_TIME_ZONE = "America/Chicago";

function parseDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDate(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateWithYear(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatTime(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatLongDate(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatLongDateTime(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatMonthYear(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatWeekdayDate(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatWeekdayDateTime(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("weekday")}, ${get("month")} ${get("day")} at ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

export function formatLongWeekdayDateTime(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatRelativeTime(
  value: Date | string | null | undefined,
  now = new Date(),
): string {
  if (!value) {
    return "Never";
  }

  const date = parseDate(value);
  if (!date) {
    return "Never";
  }

  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function formatOptionalDateTime(
  value: Date | string | null | undefined,
  fallback = "Not available",
): string {
  const formatted = formatLongDateTime(value);
  return formatted || fallback;
}

export function formatOptionalDate(
  value: Date | string | null | undefined,
  fallback = "Not available",
): string {
  const formatted = formatLongDate(value);
  return formatted || fallback;
}
