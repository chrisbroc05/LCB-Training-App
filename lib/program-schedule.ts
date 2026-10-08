const CHICAGO_TIME_ZONE = "America/Chicago";

export const PROGRAM_DAY_COUNT = 84;

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

export function addChicagoCalendarDays(dateKey: string, days: number) {
  const date = dateKeyToUtcNoon(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return getChicagoDateKey(date);
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

export function getChicagoSundayStart(now = new Date()) {
  const todayKey = getChicagoTodayDateKey(now);
  const weekdayIndex = getChicagoWeekdayIndex(now);
  const daysSinceSunday = weekdayIndex === 6 ? 0 : weekdayIndex + 1;
  const sunday = dateKeyToUtcNoon(todayKey);
  sunday.setUTCDate(sunday.getUTCDate() - daysSinceSunday);
  sunday.setUTCHours(6, 0, 0, 0);
  return sunday;
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

export function getProgramDayNumberForDate(startDate: Date, dateKey: string) {
  const startKey = formatProgramStartDateKey(startDate);
  return diffChicagoCalendarDays(startKey, dateKey) + 1;
}

export function isDateBeforeEnrollmentStart(startDate: Date, dateKey: string) {
  const startKey = formatProgramStartDateKey(startDate);
  return diffChicagoCalendarDays(startKey, dateKey) < 0;
}

export function getDateForProgramDay(startDate: Date, programDay: number) {
  const day = dateKeyToUtcNoon(formatProgramStartDateKey(startDate));
  day.setUTCDate(day.getUTCDate() + (programDay - 1));
  return day;
}

export function getProgramEndDateKey(startDate: Date) {
  const startKey = formatProgramStartDateKey(startDate);
  return addChicagoCalendarDays(startKey, PROGRAM_DAY_COUNT - 1);
}

export function getProgramWeekNumber(programDay: number) {
  if (programDay <= 0) {
    return 0;
  }
  return Math.min(12, Math.floor((programDay - 1) / 7) + 1);
}

export function getRealDayOfWeekForProgramDay(startDate: Date, programDay: number) {
  if (programDay <= 0) {
    return 0;
  }
  const weekdayIndex = getChicagoWeekdayIndex(getDateForProgramDay(startDate, programDay));
  return weekdayIndex + 1;
}

export function getWeekdayLabelForProgramDay(startDate: Date, programDay: number) {
  const dayOfWeek = getRealDayOfWeekForProgramDay(startDate, programDay);
  return dayOfWeek > 0 ? WEEKDAY_LABELS[dayOfWeek - 1] ?? "?" : "?";
}

export function getWeekdayNameForProgramDay(startDate: Date, programDay: number) {
  const dayOfWeek = getRealDayOfWeekForProgramDay(startDate, programDay);
  return dayOfWeek > 0 ? WEEKDAY_NAMES[dayOfWeek - 1] ?? "Day" : "Day";
}

export function getProgramDayStartProgramDay(startDate: Date) {
  return 1;
}

export function getFirstSundayOnOrAfterStart(startDate: Date) {
  const startKey = formatProgramStartDateKey(startDate);
  let cursorKey = startKey;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = dateKeyToUtcNoon(cursorKey);
    if (getChicagoWeekdayIndex(date) === 6) {
      return date;
    }
    cursorKey = addChicagoCalendarDays(cursorKey, 1);
  }
  return dateKeyToUtcNoon(cursorKey);
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
  startDate: Date;
  programDay: number;
  isBeforeStart: boolean;
  isComplete: boolean;
}): ProgramDayInfo {
  const weekNumber = getProgramWeekNumber(params.programDay);
  const dayOfWeek =
    params.programDay > 0
      ? getRealDayOfWeekForProgramDay(params.startDate, params.programDay)
      : 0;

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
    return {
      programDay: 0,
      weekNumber: 0,
      dayOfWeek: 0,
      phase: "FOUNDATION",
      isBeforeStart: true,
      isComplete: false,
    };
  }

  const todayKey = getChicagoTodayDateKey(now);

  if (isDateBeforeEnrollmentStart(enrollment.startDate, todayKey)) {
    return {
      programDay: 0,
      weekNumber: 0,
      dayOfWeek: 0,
      phase: "FOUNDATION",
      isBeforeStart: true,
      isComplete: false,
    };
  }

  const programDay = getProgramDayNumberForDate(enrollment.startDate, todayKey);

  if (programDay > PROGRAM_DAY_COUNT) {
    return buildProgramDayInfo({
      startDate: enrollment.startDate,
      programDay,
      isBeforeStart: false,
      isComplete: true,
    });
  }

  return buildProgramDayInfo({
    startDate: enrollment.startDate,
    programDay,
    isBeforeStart: false,
    isComplete: false,
  });
}

export function getProgramWeekStartProgramDay(weekNumber: number) {
  return (weekNumber - 1) * 7 + 1;
}

export function runProgramScheduleSelfTests() {
  const mondayStartKey = "2026-01-05";
  const thursdayStartKey = "2026-01-08";

  const cases = [
    {
      name: "monday start day 1",
      startKey: mondayStartKey,
      nowKey: "2026-01-05",
      expected: { programDay: 1, weekNumber: 1, dayOfWeek: 1, isBeforeStart: false, isComplete: false },
    },
    {
      name: "monday start day 7 sunday",
      startKey: mondayStartKey,
      nowKey: "2026-01-11",
      expected: { programDay: 7, weekNumber: 1, dayOfWeek: 7, isBeforeStart: false, isComplete: false },
    },
    {
      name: "monday start week 2 monday",
      startKey: mondayStartKey,
      nowKey: "2026-01-12",
      expected: { programDay: 8, weekNumber: 2, dayOfWeek: 1, isBeforeStart: false, isComplete: false },
    },
    {
      name: "monday start day 84",
      startKey: mondayStartKey,
      nowKey: "2026-03-29",
      expected: { programDay: 84, weekNumber: 12, dayOfWeek: 7, isBeforeStart: false, isComplete: false },
    },
    {
      name: "monday start day 85 complete",
      startKey: mondayStartKey,
      nowKey: "2026-03-30",
      expected: { programDay: 85, weekNumber: 12, dayOfWeek: 1, isBeforeStart: false, isComplete: true },
    },
    {
      name: "before start",
      startKey: mondayStartKey,
      nowKey: "2026-01-04",
      expected: { programDay: 0, weekNumber: 0, dayOfWeek: 0, isBeforeStart: true, isComplete: false },
    },
    {
      name: "thursday start day 1",
      startKey: thursdayStartKey,
      nowKey: "2026-01-08",
      expected: { programDay: 1, weekNumber: 1, dayOfWeek: 4, isBeforeStart: false, isComplete: false },
    },
    {
      name: "thursday start before start",
      startKey: thursdayStartKey,
      nowKey: "2026-01-07",
      expected: { programDay: 0, weekNumber: 0, dayOfWeek: 0, isBeforeStart: true, isComplete: false },
    },
    {
      name: "thursday start week 2",
      startKey: thursdayStartKey,
      nowKey: "2026-01-15",
      expected: { programDay: 8, weekNumber: 2, dayOfWeek: 4, isBeforeStart: false, isComplete: false },
    },
  ] as const;

  for (const testCase of cases) {
    const startDate = parseProgramDateKey(testCase.startKey);
    const result = getProgramDay({ startDate }, dateKeyToUtcNoon(testCase.nowKey));

    for (const [key, value] of Object.entries(testCase.expected)) {
      if (result[key as keyof typeof testCase.expected] !== value) {
        throw new Error(
          `${testCase.name}: expected ${key}=${value}, got ${result[key as keyof typeof testCase.expected]}`,
        );
      }
    }
  }

  const mondayStart = parseProgramDateKey(mondayStartKey);
  const thursdayStart = parseProgramDateKey(thursdayStartKey);

  const mondayEndKey = getProgramEndDateKey(mondayStart);
  const thursdayEndKey = getProgramEndDateKey(thursdayStart);

  if (getProgramWeekNumber(1) !== 1 || getProgramWeekNumber(7) !== 1 || getProgramWeekNumber(8) !== 2) {
    throw new Error("Program week number formula failed.");
  }

  if (getProgramWeekNumber(78) !== 12 || getProgramWeekNumber(84) !== 12) {
    throw new Error("Program week 12 boundaries failed.");
  }

  const thursdayWeek1 = getProgramDay({ startDate: thursdayStart }, dateKeyToUtcNoon("2026-01-08"));
  if (thursdayWeek1.dayOfWeek !== 4) {
    throw new Error(`thursday start day 1: expected dayOfWeek=4, got ${thursdayWeek1.dayOfWeek}`);
  }

  const adminStartDate = new Date("2026-01-05T00:00:00.000Z");
  const adminDay1 = getProgramDay({ startDate: adminStartDate }, dateKeyToUtcNoon("2026-01-05"));
  if (adminDay1.programDay !== 1 || adminDay1.dayOfWeek !== 1) {
    throw new Error(
      `admin db midnight: expected programDay=1 dayOfWeek=1, got ${adminDay1.programDay}/${adminDay1.dayOfWeek}`,
    );
  }

  const adminWeekday = getWeekdayLabelForProgramDay(adminStartDate, 6);
  if (adminWeekday !== "S") {
    throw new Error(`admin db midnight: expected weekday S for programDay 6, got ${adminWeekday}`);
  }

  console.log(`Monday start ${mondayStartKey}: week 1 day 1, week 2 day 8, week 12 day 78, end ${mondayEndKey}`);
  console.log(
    `Thursday start ${thursdayStartKey}: week 1 day 1, week 2 day 8, week 12 day 78, end ${thursdayEndKey}`,
  );

  return cases.length + 1;
}
