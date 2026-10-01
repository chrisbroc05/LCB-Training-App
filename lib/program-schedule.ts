const CHICAGO_TIME_ZONE = "America/Chicago";

export type ProgramPhase = "FOUNDATION" | "BUILD" | "COMPETE";

export type ProgramDayInfo = {
  programDay: number;
  weekNumber: number;
  dayOfWeek: number;
  phase: ProgramPhase;
  isBeforeStart: boolean;
  isComplete: boolean;
};

type EnrollmentForSchedule = {
  startDate: Date | null;
};

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function getChicagoDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function dateKeyToUtcNoon(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

function diffChicagoCalendarDays(startKey: string, endKey: string) {
  const start = dateKeyToUtcNoon(startKey);
  const end = dateKeyToUtcNoon(endKey);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function getPhaseForWeek(weekNumber: number): ProgramPhase {
  if (weekNumber >= 9) {
    return "COMPETE";
  }

  if (weekNumber >= 5) {
    return "BUILD";
  }

  return "FOUNDATION";
}

export function getChicagoTodayDateKey(now = new Date()) {
  return getChicagoDateKey(now);
}

export function getChicagoTomorrowDateKey(now = new Date()) {
  const todayKey = getChicagoTodayDateKey(now);
  const today = dateKeyToUtcNoon(todayKey);
  today.setUTCDate(today.getUTCDate() + 1);
  return getChicagoDateKey(today);
}

export function getChicagoWeekdayIndex(now = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "short",
  }).format(now);

  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
}

export function getChicagoMondayStart(now = new Date()) {
  const todayKey = getChicagoTodayDateKey(now);
  const weekdayIndex = getChicagoWeekdayIndex(now);
  const monday = dateKeyToUtcNoon(todayKey);
  monday.setUTCDate(monday.getUTCDate() - weekdayIndex);
  monday.setUTCHours(6, 0, 0, 0);
  return monday;
}

export function parseProgramDateKey(dateKey: string) {
  return dateKeyToUtcNoon(dateKey);
}

export function formatProgramStartDateKey(startDate: Date) {
  const year = startDate.getUTCFullYear();
  const month = String(startDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(startDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getProgramWeekOneMonday(startDate: Date) {
  const startKey = formatProgramStartDateKey(startDate);
  const weekdayIndex = getChicagoWeekdayIndex(dateKeyToUtcNoon(startKey));
  const monday = dateKeyToUtcNoon(startKey);
  monday.setUTCDate(monday.getUTCDate() - weekdayIndex);
  return monday;
}

export function getProgramDayNumberForDate(startDate: Date, dateKey: string) {
  const weekOneMondayKey = formatProgramStartDateKey(getProgramWeekOneMonday(startDate));
  return diffChicagoCalendarDays(weekOneMondayKey, dateKey) + 1;
}

export function isDateBeforeEnrollmentStart(startDate: Date, dateKey: string) {
  const startKey = formatProgramStartDateKey(startDate);
  return diffChicagoCalendarDays(startKey, dateKey) < 0;
}

export function getDateForProgramDay(startDate: Date, programDay: number) {
  const weekOneMonday = getProgramWeekOneMonday(startDate);
  const day = dateKeyToUtcNoon(formatProgramStartDateKey(weekOneMonday));
  day.setUTCDate(day.getUTCDate() + (programDay - 1));
  return day;
}

export function getWeekdayLabelForProgramDay(startDate: Date, programDay: number) {
  const dayOfWeek = ((programDay - 1) % 7) + 1;
  return WEEKDAY_LABELS[dayOfWeek - 1] ?? "?";
}

export function getWeekdayNameForProgramDay(startDate: Date, programDay: number) {
  const dayOfWeek = ((programDay - 1) % 7) + 1;
  return WEEKDAY_NAMES[dayOfWeek - 1] ?? "Day";
}

export function getProgramDayStartProgramDay(startDate: Date) {
  return getProgramDayNumberForDate(startDate, formatProgramStartDateKey(startDate));
}

export function formatProgramStartLabel(startDate: Date, now = new Date()) {
  const startKey = formatProgramStartDateKey(startDate);
  const todayKey = getChicagoTodayDateKey(now);

  if (startKey === todayKey) {
    return "Today";
  }

  const labelDate = parseProgramDateKey(startKey);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(labelDate);
}

function buildProgramDayInfo(params: {
  programDay: number;
  isBeforeStart: boolean;
  isComplete: boolean;
}): ProgramDayInfo {
  const weekNumber =
    params.programDay > 0 ? Math.min(12, Math.ceil(params.programDay / 7)) : 0;
  const dayOfWeek = params.programDay > 0 ? ((params.programDay - 1) % 7) + 1 : 0;

  return {
    programDay: params.programDay,
    weekNumber,
    dayOfWeek,
    phase: weekNumber > 0 ? getPhaseForWeek(weekNumber) : "FOUNDATION",
    isBeforeStart: params.isBeforeStart,
    isComplete: params.isComplete,
  };
}

export function getProgramDay(
  enrollment: EnrollmentForSchedule,
  now = new Date(),
): ProgramDayInfo {
  if (!enrollment.startDate) {
    return buildProgramDayInfo({
      programDay: 0,
      isBeforeStart: true,
      isComplete: false,
    });
  }

  const todayKey = getChicagoTodayDateKey(now);
  const programDay = getProgramDayNumberForDate(enrollment.startDate, todayKey);

  if (programDay < 1) {
    return buildProgramDayInfo({
      programDay: 0,
      isBeforeStart: true,
      isComplete: false,
    });
  }

  const isBeforeStart = isDateBeforeEnrollmentStart(enrollment.startDate, todayKey);

  if (programDay > 84) {
    return buildProgramDayInfo({
      programDay,
      isBeforeStart: false,
      isComplete: true,
    });
  }

  return buildProgramDayInfo({
    programDay,
    isBeforeStart,
    isComplete: false,
  });
}

export function getProgramWeekStartProgramDay(weekNumber: number) {
  return (weekNumber - 1) * 7 + 1;
}

export function runProgramScheduleSelfTests() {
  const cases = [
    {
      name: "monday start day 1",
      startKey: "2026-01-05",
      nowKey: "2026-01-05",
      expected: { programDay: 1, weekNumber: 1, dayOfWeek: 1, isBeforeStart: false, isComplete: false },
    },
    {
      name: "monday start day 7 sunday",
      startKey: "2026-01-05",
      nowKey: "2026-01-11",
      expected: { programDay: 7, weekNumber: 1, dayOfWeek: 7, isBeforeStart: false, isComplete: false },
    },
    {
      name: "monday start week 2 monday",
      startKey: "2026-01-05",
      nowKey: "2026-01-12",
      expected: { programDay: 8, weekNumber: 2, dayOfWeek: 1, isBeforeStart: false, isComplete: false },
    },
    {
      name: "monday start day 84",
      startKey: "2026-01-05",
      nowKey: "2026-03-29",
      expected: { programDay: 84, weekNumber: 12, dayOfWeek: 7, isBeforeStart: false, isComplete: false },
    },
    {
      name: "monday start day 85 complete",
      startKey: "2026-01-05",
      nowKey: "2026-03-30",
      expected: { programDay: 85, weekNumber: 12, dayOfWeek: 1, isBeforeStart: false, isComplete: true },
    },
    {
      name: "before start",
      startKey: "2026-01-05",
      nowKey: "2026-01-04",
      expected: { programDay: 0, weekNumber: 0, dayOfWeek: 0, isBeforeStart: true, isComplete: false },
    },
    {
      name: "saturday start first active day",
      startKey: "2026-01-10",
      nowKey: "2026-01-10",
      expected: { programDay: 6, weekNumber: 1, dayOfWeek: 6, isBeforeStart: false, isComplete: false },
    },
    {
      name: "saturday start thursday same week not started",
      startKey: "2026-01-10",
      nowKey: "2026-01-08",
      expected: { programDay: 4, weekNumber: 1, dayOfWeek: 4, isBeforeStart: true, isComplete: false },
    },
  ] as const;

  for (const testCase of cases) {
    const result = getProgramDay(
      { startDate: parseProgramDateKey(testCase.startKey) },
      dateKeyToUtcNoon(testCase.nowKey),
    );

    if ("expected" in testCase) {
      for (const [key, value] of Object.entries(testCase.expected)) {
        if (result[key as keyof typeof testCase.expected] !== value) {
          throw new Error(
            `${testCase.name}: expected ${key}=${value}, got ${result[key as keyof typeof testCase.expected]}`,
          );
        }
      }
    }
  }

  const saturdayStart = { startDate: parseProgramDateKey("2026-01-10") };
  const thursdayInfo = getProgramDay(saturdayStart, dateKeyToUtcNoon("2026-01-08"));
  if (thursdayInfo.dayOfWeek !== 4) {
    throw new Error(`saturday cohort thursday: expected dayOfWeek=4, got ${thursdayInfo.dayOfWeek}`);
  }

  const saturdayInfo = getProgramDay(saturdayStart, dateKeyToUtcNoon("2026-01-10"));
  if (saturdayInfo.dayOfWeek !== 6) {
    throw new Error(`saturday cohort start day: expected dayOfWeek=6, got ${saturdayInfo.dayOfWeek}`);
  }

  const adminStartDate = new Date("2026-01-05T00:00:00.000Z");
  const adminDay1 = getProgramDay(
    { startDate: adminStartDate },
    dateKeyToUtcNoon("2026-01-05"),
  );
  if (adminDay1.programDay !== 1 || adminDay1.dayOfWeek !== 1) {
    throw new Error(
      `admin db midnight: expected programDay=1 dayOfWeek=1, got ${adminDay1.programDay}/${adminDay1.dayOfWeek}`,
    );
  }

  const adminWeekday = getWeekdayLabelForProgramDay(adminStartDate, 6);
  if (adminWeekday !== "S") {
    throw new Error(`admin db midnight: expected weekday S for programDay 6, got ${adminWeekday}`);
  }

  return cases.length + 1;
}
