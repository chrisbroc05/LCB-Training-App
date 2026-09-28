import {
  formatProgramStartDateKey,
  getChicagoTodayDateKey,
  getChicagoWeekdayIndex,
  parseProgramDateKey,
} from "@/lib/program-schedule";

const CHICAGO_TIME_ZONE = "America/Chicago";

export type ChicagoDateTimeParts = {
  dateKey: string;
  hour: number;
  minute: number;
  weekdayIndex: number;
  isSaturday: boolean;
  isSunday: boolean;
};

export function getChicagoDateTimeParts(now = new Date()): ChicagoDateTimeParts {
  const dateKey = getChicagoTodayDateKey(now);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);

  const hour = Number.parseInt(parts.find((part) => part.type === "hour")?.value ?? "0", 10);
  const minute = Number.parseInt(parts.find((part) => part.type === "minute")?.value ?? "0", 10);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const weekdayIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);

  return {
    dateKey,
    hour,
    minute,
    weekdayIndex,
    isSaturday: weekdayIndex === 5,
    isSunday: weekdayIndex === 6,
  };
}

export function getChicagoYesterdayDateKey(now = new Date()) {
  const todayKey = getChicagoTodayDateKey(now);
  const today = parseProgramDateKey(todayKey);
  today.setUTCDate(today.getUTCDate() - 1);
  return formatProgramStartDateKey(today);
}

export function getChicagoTomorrowDateKeyFromDateKey(dateKey: string) {
  const date = parseProgramDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + 1);
  return formatProgramStartDateKey(date);
}

export function getChicagoDayStart(dateKey: string) {
  return parseProgramDateKey(dateKey);
}

export function getChicagoDayEnd(dateKey: string) {
  const end = parseProgramDateKey(dateKey);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
}

export function isDateKeyOnOrAfter(dateKey: string, minDateKey: string) {
  return dateKey >= minDateKey;
}

export function getChicagoWeekdayIndexForDateKey(dateKey: string) {
  const date = parseProgramDateKey(dateKey);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "short",
  }).format(date);

  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
}

export { getChicagoWeekdayIndex };
