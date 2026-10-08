import { getDateForProgramDay, getRealDayOfWeekForProgramDay } from "@/lib/program-schedule";

export function getDayOfWeekForProgramDay(startDate: Date, programDay: number) {
  return getRealDayOfWeekForProgramDay(startDate, programDay);
}

export function computeProgramStreak(params: {
  startDate: Date;
  currentProgramDay: number;
  completedWorkDays: Set<number>;
}) {
  if (params.currentProgramDay <= 0) {
    return 0;
  }

  let streak = 0;
  let day = params.currentProgramDay;

  if (!params.completedWorkDays.has(day)) {
    day -= 1;
  }

  while (day >= 1) {
    const dayOfWeek = getDayOfWeekForProgramDay(params.startDate, day);
    if (dayOfWeek === 7) {
      day -= 1;
      continue;
    }

    if (!params.completedWorkDays.has(day)) {
      break;
    }

    streak += 1;
    day -= 1;
  }

  return streak;
}
