import { getDayOfWeekForProgramDay } from "@/lib/program-streak-shared";
import { getChicagoDaysSinceDate } from "@/lib/program-schedule";

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

export type GoneQuietSilence =
  | { kind: "never_logged" }
  | { kind: "days_since"; days: number };

/** Silence for gone-quiet copy: never logged, or Chicago calendar days since last completion. */
export function getGoneQuietSilence(
  completions: Array<{ completedAt: Date }>,
  now = new Date(),
): GoneQuietSilence {
  if (completions.length === 0) {
    return { kind: "never_logged" };
  }

  let lastCompletedAt = completions[0].completedAt;
  for (const item of completions) {
    if (item.completedAt.getTime() > lastCompletedAt.getTime()) {
      lastCompletedAt = item.completedAt;
    }
  }

  return {
    kind: "days_since",
    days: Math.max(1, getChicagoDaysSinceDate(lastCompletedAt, now)),
  };
}

export function formatParentGoneQuietSubject(
  playerFirstName: string,
  silence: GoneQuietSilence,
) {
  if (silence.kind === "never_logged") {
    return `${playerFirstName} hasn't logged any work yet`;
  }

  const unit = silence.days === 1 ? "day" : "days";
  return `${playerFirstName} hasn't logged work in ${silence.days} ${unit}`;
}

export function formatPlayerGoneQuietHeadline(silence: GoneQuietSilence) {
  if (silence.kind === "never_logged") {
    return "You haven't logged any work yet.";
  }

  const unit = silence.days === 1 ? "day" : "days";
  return `${silence.days} ${unit} off. It happens.`;
}

export function formatParentGoneQuietRecapNote(
  playerFirstName: string,
  silence: GoneQuietSilence,
) {
  if (silence.kind === "never_logged") {
    return `${playerFirstName} hasn't logged any work yet. A little nudge goes a long way.`;
  }

  const unit = silence.days === 1 ? "day" : "days";
  return `${playerFirstName} hasn't logged work in ${silence.days} ${unit}. A little nudge goes a long way.`;
}
