export const ASSESSMENT_CALL_TIMEZONE = "America/Chicago";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  let hour = Number(get("hour"));

  if (hour === 24) {
    hour = 0;
  }

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour,
    minute: Number(get("minute")),
  };
}

function getCentralTimeZoneAbbreviation(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ASSESSMENT_CALL_TIMEZONE,
    timeZoneName: "short",
  }).formatToParts(date);

  return parts.find((part) => part.type === "timeZoneName")?.value ?? "CT";
}

function zonedLocalTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) {
  let utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const zoned = getZonedParts(new Date(utcMillis), timeZone);
    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      0,
    );
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    utcMillis -= zonedAsUtc - desiredAsUtc;
  }

  return new Date(utcMillis);
}

export function formatAssessmentCallDateTime(date: Date) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: ASSESSMENT_CALL_TIMEZONE,
  }).format(date);

  return `${formatted} ${getCentralTimeZoneAbbreviation(date)}`;
}

export function parseAssessmentCallDateTime(callDate: string, callTime: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(callDate) || !/^\d{2}:\d{2}$/.test(callTime)) {
    return null;
  }

  const [year, month, day] = callDate.split("-").map(Number);
  const [hour, minute] = callTime.split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const parsed = zonedLocalTimeToUtc(year, month, day, hour, minute, ASSESSMENT_CALL_TIMEZONE);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function toAssessmentCallInputValues(date: Date) {
  const parts = getZonedParts(date, ASSESSMENT_CALL_TIMEZONE);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  const hour = String(parts.hour).padStart(2, "0");
  const minute = String(parts.minute).padStart(2, "0");

  return {
    callDate: `${parts.year}-${month}-${day}`,
    callTime: `${hour}:${minute}`,
  };
}
