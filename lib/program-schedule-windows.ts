export type ProgramScheduleDayFilter = "saturday" | "sunday";

export type ProgramScheduleWindow = {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  dayFilter?: ProgramScheduleDayFilter;
};

export const PROGRAM_SCHEDULE_WINDOWS: ProgramScheduleWindow[] = [
  {
    id: "morning-seven",
    label: "7am daily routine and day-before-start email/push",
    startHour: 7,
    endHour: 12,
  },
  {
    id: "saturday-video",
    label: "Saturday 10am video email/push",
    startHour: 10,
    endHour: 15,
    dayFilter: "saturday",
  },
  {
    id: "daily-work",
    label: "3pm daily work push",
    startHour: 15,
    endHour: 20,
  },
  {
    id: "gone-quiet",
    label: "5pm gone quiet email/push",
    startHour: 17,
    endHour: 20,
  },
  {
    id: "parent-weekly-recap",
    label: "Sunday 6pm parent weekly recap email",
    startHour: 18,
    endHour: 22,
    dayFilter: "sunday",
  },
  {
    id: "coach-nightly",
    label: "8pm coach nightly summary email/push",
    startHour: 20,
    endHour: 23,
  },
];

export function isInSendWindow(hour: number, startHour: number, endHour: number) {
  return hour >= startHour && hour < endHour;
}

export function isScheduleWindowActiveForDay(
  window: ProgramScheduleWindow,
  day: { isSaturday: boolean; isSunday: boolean },
) {
  if (!window.dayFilter) {
    return true;
  }

  if (window.dayFilter === "saturday") {
    return day.isSaturday;
  }

  return day.isSunday;
}

export function getActiveScheduleWindows(
  hour: number,
  day: { isSaturday: boolean; isSunday: boolean },
) {
  return PROGRAM_SCHEDULE_WINDOWS.filter(
    (window) =>
      isInSendWindow(hour, window.startHour, window.endHour) &&
      isScheduleWindowActiveForDay(window, day),
  );
}

export function formatScheduleWindow(window: ProgramScheduleWindow) {
  const daySuffix = window.dayFilter
    ? window.dayFilter === "saturday"
      ? " (Sat)"
      : " (Sun)"
    : "";
  return `${window.label}: ${window.startHour}:00-${window.endHour}:00 Chicago${daySuffix}`;
}

export function formatActiveScheduleWindows(
  hour: number,
  day: { isSaturday: boolean; isSunday: boolean },
) {
  const active = getActiveScheduleWindows(hour, day);
  if (active.length === 0) {
    return "none";
  }

  return active.map((window) => window.id).join(", ");
}

export function simulateHourlyCronFirstFireHours(day: {
  isSaturday: boolean;
  isSunday: boolean;
}) {
  const firstFireHourByWindowId: Record<string, number> = {};
  const sentWindowIds = new Set<string>();

  for (let hour = 0; hour < 24; hour += 1) {
    for (const window of getActiveScheduleWindows(hour, day)) {
      if (sentWindowIds.has(window.id)) {
        continue;
      }

      firstFireHourByWindowId[window.id] = hour;
      sentWindowIds.add(window.id);
    }
  }

  return firstFireHourByWindowId;
}

export function runProgramSendWindowSelfTests() {
  const weekday = { isSaturday: false, isSunday: false };
  const saturday = { isSaturday: true, isSunday: false };
  const sunday = { isSaturday: false, isSunday: true };

  const weekdayFires = simulateHourlyCronFirstFireHours(weekday);
  const expectedWeekday: Record<string, number> = {
    "morning-seven": 7,
    "daily-work": 15,
    "gone-quiet": 17,
    "coach-nightly": 20,
  };

  for (const [windowId, expectedHour] of Object.entries(expectedWeekday)) {
    if (weekdayFires[windowId] !== expectedHour) {
      throw new Error(
        `weekday ${windowId}: expected first fire at hour ${expectedHour}, got ${weekdayFires[windowId] ?? "none"}`,
      );
    }
  }

  if (weekdayFires["saturday-video"] !== undefined) {
    throw new Error("weekday should not fire saturday-video");
  }

  if (weekdayFires["parent-weekly-recap"] !== undefined) {
    throw new Error("weekday should not fire parent-weekly-recap");
  }

  const saturdayFires = simulateHourlyCronFirstFireHours(saturday);
  if (saturdayFires["saturday-video"] !== 10) {
    throw new Error(
      `saturday-video: expected first fire at hour 10, got ${saturdayFires["saturday-video"] ?? "none"}`,
    );
  }

  const sundayFires = simulateHourlyCronFirstFireHours(sunday);
  if (sundayFires["parent-weekly-recap"] !== 18) {
    throw new Error(
      `parent-weekly-recap: expected first fire at hour 18, got ${sundayFires["parent-weekly-recap"] ?? "none"}`,
    );
  }

  if (sundayFires["saturday-video"] !== undefined) {
    throw new Error("sunday should not fire saturday-video");
  }

  for (let hour = 0; hour < 24; hour += 1) {
    const active = getActiveScheduleWindows(hour, weekday);
    for (const window of active) {
      if (!isInSendWindow(hour, window.startHour, window.endHour)) {
        throw new Error(`${window.id} active outside send window at hour ${hour}`);
      }
    }
  }

  const catchUpFires = (() => {
    const firstFireHourByWindowId: Record<string, number> = {};
    const sentWindowIds = new Set<string>();

    for (let hour = 8; hour < 24; hour += 1) {
      for (const window of getActiveScheduleWindows(hour, weekday)) {
        if (sentWindowIds.has(window.id)) {
          continue;
        }

        firstFireHourByWindowId[window.id] = hour;
        sentWindowIds.add(window.id);
      }
    }

    return firstFireHourByWindowId;
  })();

  if (catchUpFires["morning-seven"] !== 8) {
    throw new Error(
      `catch-up morning-seven: expected first fire at hour 8, got ${catchUpFires["morning-seven"] ?? "none"}`,
    );
  }

  let caseCount = Object.keys(expectedWeekday).length + 4;
  caseCount += 24;
  caseCount += 1;

  return caseCount;
}
