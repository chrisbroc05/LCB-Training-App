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

export function getDateForProgramDay(startDate: Date, programDay: number) {
  const startKey = formatProgramStartDateKey(startDate);
  const day = dateKeyToUtcNoon(startKey);
  day.setUTCDate(day.getUTCDate() + (programDay - 1));
  return day;
}

export function getWeekdayLabelForProgramDay(startDate: Date, programDay: number) {
  const day = getDateForProgramDay(startDate, programDay);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "short",
  }).format(day);

  return weekday.charAt(0);
}

export function getWeekdayNameForProgramDay(startDate: Date, programDay: number) {
  const day = getDateForProgramDay(startDate, programDay);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "long",
  }).format(day);
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

  const startKey = formatProgramStartDateKey(enrollment.startDate);
  const todayKey = getChicagoTodayDateKey(now);
  const dayDiff = diffChicagoCalendarDays(startKey, todayKey);

  if (dayDiff < 0) {
    return {
      programDay: 0,
      weekNumber: 0,
      dayOfWeek: 0,
      phase: "FOUNDATION",
      isBeforeStart: true,
      isComplete: false,
    };
  }

  const programDay = dayDiff + 1;

  if (programDay > 84) {
    return {
      programDay,
      weekNumber: 12,
      dayOfWeek: 7,
      phase: "COMPETE",
      isBeforeStart: false,
      isComplete: true,
    };
  }

  const weekNumber = Math.ceil(programDay / 7);
  const dayOfWeek = ((programDay - 1) % 7) + 1;

  return {
    programDay,
    weekNumber,
    dayOfWeek,
    phase: getPhaseForWeek(weekNumber),
    isBeforeStart: false,
    isComplete: false,
  };
}

export function runProgramScheduleSelfTests() {
  const cases = [
    {
      name: "day 1",
      startKey: "2026-01-05",
      nowKey: "2026-01-05",
      expected: { programDay: 1, weekNumber: 1, dayOfWeek: 1, isBeforeStart: false, isComplete: false },
    },
    {
      name: "day 7",
      startKey: "2026-01-05",
      nowKey: "2026-01-11",
      expected: { programDay: 7, weekNumber: 1, dayOfWeek: 7, isBeforeStart: false, isComplete: false },
    },
    {
      name: "day 8",
      startKey: "2026-01-05",
      nowKey: "2026-01-12",
      expected: { programDay: 8, weekNumber: 2, dayOfWeek: 1, isBeforeStart: false, isComplete: false },
    },
    {
      name: "day 84",
      startKey: "2026-01-05",
      nowKey: "2026-03-29",
      expected: { programDay: 84, weekNumber: 12, dayOfWeek: 7, isBeforeStart: false, isComplete: false },
    },
    {
      name: "day 85",
      startKey: "2026-01-05",
      nowKey: "2026-03-30",
      expected: { programDay: 85, weekNumber: 12, dayOfWeek: 7, isBeforeStart: false, isComplete: true },
    },
    {
      name: "before start",
      startKey: "2026-01-05",
      nowKey: "2026-01-04",
      expected: { programDay: 0, weekNumber: 0, dayOfWeek: 0, isBeforeStart: true, isComplete: false },
    },
  ] as const;

  for (const testCase of cases) {
    const result = getProgramDay(
      { startDate: parseProgramDateKey(testCase.startKey) },
      dateKeyToUtcNoon(testCase.nowKey),
    );

    for (const [key, value] of Object.entries(testCase.expected)) {
      if (result[key as keyof typeof testCase.expected] !== value) {
        throw new Error(
          `${testCase.name}: expected ${key}=${value}, got ${result[key as keyof typeof testCase.expected]}`,
        );
      }
    }
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

  const adminWeekday = getWeekdayLabelForProgramDay(adminStartDate, 1);
  if (adminWeekday !== "M") {
    throw new Error(`admin db midnight: expected weekday M, got ${adminWeekday}`);
  }

  const adminDay4 = getProgramDay(
    { startDate: adminStartDate },
    dateKeyToUtcNoon("2026-01-08"),
  );
  if (adminDay4.programDay !== 4 || adminDay4.dayOfWeek !== 4) {
    throw new Error(
      `admin db midnight day 4: expected programDay=4 dayOfWeek=4, got ${adminDay4.programDay}/${adminDay4.dayOfWeek}`,
    );
  }

  const adminDay4Weekday = getWeekdayLabelForProgramDay(adminStartDate, 4);
  if (adminDay4Weekday !== "T") {
    throw new Error(`admin db midnight day 4: expected weekday T, got ${adminDay4Weekday}`);
  }

  return cases.length + 1;
}
