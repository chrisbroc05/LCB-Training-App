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

export function parseProgramDateKey(dateKey: string) {
  return dateKeyToUtcNoon(dateKey);
}

export function formatProgramStartLabel(startDate: Date, now = new Date()) {
  const startKey = getChicagoDateKey(startDate);
  const todayKey = getChicagoTodayDateKey(now);

  if (startKey === todayKey) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(startDate);
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

  const startKey = getChicagoDateKey(enrollment.startDate);
  const todayKey = getChicagoDateKey(now);
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

  return cases.length;
}
