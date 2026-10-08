import { getDayOfWeekForProgramDay } from "@/lib/program-streak-shared";

export function getRecentWorkProgramDays(
  startDate: Date,
  currentProgramDay: number,
  count: number,
) {
  const days: number[] = [];
  let cursor = currentProgramDay;

  while (cursor > 0 && days.length < count) {
    if (getDayOfWeekForProgramDay(startDate, cursor) !== 7) {
      days.push(cursor);
    }
    cursor -= 1;
  }

  return days;
}

export function isGoneQuiet(
  startDate: Date,
  currentProgramDay: number,
  completionDays: Set<number>,
) {
  if (currentProgramDay <= 0) {
    return false;
  }

  const recentWorkDays = getRecentWorkProgramDays(startDate, currentProgramDay, 2);
  if (recentWorkDays.length === 0) {
    return false;
  }

  return recentWorkDays.every((day) => !completionDays.has(day));
}
