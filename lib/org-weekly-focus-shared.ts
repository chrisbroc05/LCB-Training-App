/**
 * Org weekly focus week boundaries (America/Chicago, Monday start).
 */

import {
  chicagoStartOfCalendarDay,
  parseChicagoDateInput,
} from "@/lib/org-trial-dates-shared";

const CHICAGO_TZ = "America/Chicago";

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function readChicagoWeekdayIndex(instant: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    weekday: "long",
  }).format(instant);
  return WEEKDAY_INDEX[weekday] ?? 0;
}

function readChicagoYmd(instant: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(instant);
  const read = (type: string) => Number(parts.find((entry) => entry.type === type)?.value ?? "0");
  return { year: read("year"), month: read("month"), day: read("day") };
}

function addCalendarDays(year: number, month: number, day: number, delta: number) {
  const cursor = new Date(Date.UTC(year, month - 1, day + delta, 12, 0, 0, 0));
  return {
    year: cursor.getUTCFullYear(),
    month: cursor.getUTCMonth() + 1,
    day: cursor.getUTCDate(),
  };
}

const CHICAGO_DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date strings from `<input type="date">` are Chicago days, not UTC midnight. */
export function toChicagoCalendarInstant(value: Date | string): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }
  const trimmed = value.trim();
  if (CHICAGO_DATE_INPUT.test(trimmed)) {
    const parsed = parseChicagoDateInput(trimmed);
    if (parsed) {
      return chicagoStartOfCalendarDay(parsed.year, parsed.month, parsed.day);
    }
  }
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

/** Monday 00:00 America/Chicago for the week containing `date`. */
export function getWeekStartMondayChicago(date: Date | string = new Date()): Date {
  const instant = toChicagoCalendarInstant(date);
  const { year, month, day } = readChicagoYmd(instant);
  const weekday = readChicagoWeekdayIndex(instant);
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = addCalendarDays(year, month, day, -daysFromMonday);
  return chicagoStartOfCalendarDay(monday.year, monday.month, monday.day);
}

export function formatWeekStartChicagoInputValue(weekStart: Date | string): string {
  const instant = toChicagoCalendarInstant(weekStart);
  const { year, month, day } = readChicagoYmd(instant);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseWeekStartChicagoInput(value: string): Date | null {
  const parsed = parseChicagoDateInput(value);
  if (!parsed) {
    return null;
  }
  const anchor = chicagoStartOfCalendarDay(parsed.year, parsed.month, parsed.day);
  return getWeekStartMondayChicago(anchor);
}

export function weekStartDatesMatch(a: Date | string, b: Date | string): boolean {
  return (
    getWeekStartMondayChicago(a).getTime() === getWeekStartMondayChicago(b).getTime()
  );
}

export function formatWeekStartLabel(weekStart: Date | string): string {
  const normalized = getWeekStartMondayChicago(weekStart);
  const { year, month, day } = readChicagoYmd(normalized);
  const display = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  return display.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type OrgWeeklyFocusRow = {
  id: string;
  orgTeamId: string | null;
  weekStartDate: Date | string;
  title: string;
  notes: string | null;
  drillIds: string[];
};

/** Team row overrides whole-club row for the same week. */
export function pickOrgWeeklyFocusForMember(
  focuses: readonly OrgWeeklyFocusRow[],
  orgTeamId: string | null,
  weekStart: Date,
): OrgWeeklyFocusRow | null {
  const normalizedWeek = getWeekStartMondayChicago(weekStart);
  const forWeek = focuses.filter((row) => weekStartDatesMatch(row.weekStartDate, normalizedWeek));

  if (orgTeamId) {
    const teamRow = forWeek.find((row) => row.orgTeamId === orgTeamId);
    if (teamRow) {
      return teamRow;
    }
  }

  return forWeek.find((row) => row.orgTeamId === null) ?? null;
}

export type TeamFocusPreviewRow = {
  teamId: string;
  teamName: string;
  focusTitle: string | null;
  source: "team" | "club" | "none";
};

export function buildTeamFocusPreview(params: {
  teams: Array<{ id: string; name: string; active: boolean }>;
  focuses: readonly OrgWeeklyFocusRow[];
  weekStart: Date;
}): TeamFocusPreviewRow[] {
  const normalizedWeek = getWeekStartMondayChicago(params.weekStart);
  const forWeek = params.focuses.filter((row) =>
    weekStartDatesMatch(row.weekStartDate, normalizedWeek),
  );
  const clubFocus = forWeek.find((row) => row.orgTeamId === null) ?? null;

  return params.teams
    .filter((team) => team.active)
    .map((team) => {
      const teamFocus = forWeek.find((row) => row.orgTeamId === team.id) ?? null;
      if (teamFocus) {
        return {
          teamId: team.id,
          teamName: team.name,
          focusTitle: teamFocus.title,
          source: "team" as const,
        };
      }
      if (clubFocus) {
        return {
          teamId: team.id,
          teamName: team.name,
          focusTitle: clubFocus.title,
          source: "club" as const,
        };
      }
      return {
        teamId: team.id,
        teamName: team.name,
        focusTitle: null,
        source: "none" as const,
      };
    });
}

/** @deprecated Use getWeekStartMondayChicago */
export function getWeekStartMondayUtc(date = new Date()): Date {
  return getWeekStartMondayChicago(date);
}
