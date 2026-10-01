/**
 * One-time migration: remap programDay and task keys from start-relative days
 * to calendar Mon-Sun program weeks (week 1 Monday = programDay 1).
 *
 * Run after deploying calendar schedule code:
 *   npx tsx scripts/migrate-program-calendar-keys.ts
 */
import "dotenv/config";

import {
  formatProgramStartDateKey,
  getProgramDayNumberForDate,
  parseProgramDateKey,
} from "../lib/program-schedule";
import { prisma } from "../lib/prisma";

function oldProgramDayToDateKey(startDate: Date, oldProgramDay: number) {
  const startKey = formatProgramStartDateKey(startDate);
  const day = parseProgramDateKey(startKey);
  day.setUTCDate(day.getUTCDate() + (oldProgramDay - 1));
  return formatProgramStartDateKey(day);
}

function remapTaskKey(taskKey: string, oldProgramDay: number, newProgramDay: number) {
  if (oldProgramDay === newProgramDay) {
    return taskKey;
  }

  return taskKey
    .replace(new RegExp(`^p${oldProgramDay}-`), `p${newProgramDay}-`)
    .replace(new RegExp(`^d${oldProgramDay}-`), `d${newProgramDay}-`);
}

async function main() {
  const enrollments = await prisma.programEnrollment.findMany({
    where: { startDate: { not: null } },
    select: { id: true, startDate: true },
  });

  let completionUpdates = 0;
  let dayLogUpdates = 0;
  let customTaskUpdates = 0;
  let skippedEnrollments = 0;

  for (const enrollment of enrollments) {
    if (!enrollment.startDate) {
      continue;
    }

    const startDate = enrollment.startDate;
    const startProgramDay = getProgramDayNumberForDate(
      startDate,
      formatProgramStartDateKey(startDate),
    );

    if (startProgramDay === 1) {
      skippedEnrollments += 1;
      continue;
    }

    const completions = await prisma.taskCompletion.findMany({
      where: { enrollmentId: enrollment.id },
      select: { id: true, programDay: true, taskKey: true },
    });

    for (const completion of completions) {
      const dateKey = oldProgramDayToDateKey(startDate, completion.programDay);
      const newProgramDay = getProgramDayNumberForDate(startDate, dateKey);
      const newTaskKey = remapTaskKey(completion.taskKey, completion.programDay, newProgramDay);

      if (
        newProgramDay !== completion.programDay ||
        newTaskKey !== completion.taskKey
      ) {
        await prisma.taskCompletion.update({
          where: { id: completion.id },
          data: {
            programDay: newProgramDay,
            taskKey: newTaskKey,
          },
        });
        completionUpdates += 1;
      }
    }

    const dayLogs = await prisma.dayLog.findMany({
      where: { enrollmentId: enrollment.id },
      select: { id: true, programDay: true },
    });

    for (const log of dayLogs) {
      const dateKey = oldProgramDayToDateKey(startDate, log.programDay);
      const newProgramDay = getProgramDayNumberForDate(startDate, dateKey);

      if (newProgramDay !== log.programDay) {
        await prisma.dayLog.update({
          where: { id: log.id },
          data: { programDay: newProgramDay },
        });
        dayLogUpdates += 1;
      }
    }

    const customTasks = await prisma.customTask.findMany({
      where: { enrollmentId: enrollment.id },
      select: { id: true, programDay: true, replacesTaskKey: true },
    });

    for (const task of customTasks) {
      const dateKey = oldProgramDayToDateKey(startDate, task.programDay);
      const newProgramDay = getProgramDayNumberForDate(startDate, dateKey);
      const newReplacesTaskKey = task.replacesTaskKey
        ? remapTaskKey(task.replacesTaskKey, task.programDay, newProgramDay)
        : null;

      if (
        newProgramDay !== task.programDay ||
        newReplacesTaskKey !== task.replacesTaskKey
      ) {
        await prisma.customTask.update({
          where: { id: task.id },
          data: {
            programDay: newProgramDay,
            replacesTaskKey: newReplacesTaskKey,
          },
        });
        customTaskUpdates += 1;
      }
    }
  }

  console.log(
    `Calendar key migration complete. Enrollments checked: ${enrollments.length}. Skipped (Monday starts): ${skippedEnrollments}. TaskCompletion updates: ${completionUpdates}. DayLog updates: ${dayLogUpdates}. CustomTask updates: ${customTaskUpdates}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
