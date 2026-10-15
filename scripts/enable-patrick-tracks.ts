import { getDailyPlan, type ProgramEnrollmentPlanInput } from "../lib/program-daily-plan";
import type { ProgramActiveTrackInput } from "../lib/program-track-plan";
import type { ProgramTrackKey } from "../lib/program-tracks";
import {
  getChicagoTodayDateKey,
  getDateForProgramDay,
  getProgramDay,
  getProgramDayNumberForDate,
  getProgramWeekStartProgramDay,
} from "../lib/program-schedule";
import { prisma } from "../lib/prisma";

const TARGET_EMAIL = "pat20062014@gmail.com";

function toEnrollmentPlanInput(enrollment: {
  ageGroup: string | null;
  focusAreas: string[];
  equipment: string[];
  strengthVariant?: string | null;
  seasonMode: string | null;
  knownFor: string | null;
}): ProgramEnrollmentPlanInput | null {
  if (!enrollment.ageGroup || !enrollment.seasonMode) {
    return null;
  }

  return {
    ageGroup: enrollment.ageGroup as ProgramEnrollmentPlanInput["ageGroup"],
    focusAreas: enrollment.focusAreas as ProgramEnrollmentPlanInput["focusAreas"],
    equipment: enrollment.equipment as ProgramEnrollmentPlanInput["equipment"],
    strengthVariant: enrollment.strengthVariant as ProgramEnrollmentPlanInput["strengthVariant"],
    seasonMode: enrollment.seasonMode as ProgramEnrollmentPlanInput["seasonMode"],
    knownFor: enrollment.knownFor,
  };
}

function buildProgramDayInfoForProgramDay(
  enrollment: { startDate: Date | null },
  programDay: number,
) {
  if (!enrollment.startDate || programDay <= 0) {
    return getProgramDay(enrollment);
  }

  const target = getDateForProgramDay(enrollment.startDate, programDay);
  return getProgramDay(enrollment, target);
}

async function loadActiveTracks(
  enrollmentId: string,
  startDate: Date,
): Promise<ProgramActiveTrackInput[]> {
  const rows = await prisma.enrollmentTrack.findMany({
    where: { enrollmentId, active: true },
  });

  return rows.map((row) => ({
    trackKey: row.trackKey as ProgramTrackKey,
    startedProgramDay: getProgramDayNumberForDate(
      startDate,
      getChicagoTodayDateKey(row.startedAt),
    ),
  }));
}

function printWeekPlan(params: {
  label: string;
  weekNumber: number;
  enrollment: {
    startDate: Date | null;
  };
  planInput: ProgramEnrollmentPlanInput;
  activeTracks: ProgramActiveTrackInput[];
}) {
  console.log(`\n=== ${params.label} (program week ${params.weekNumber}) ===`);
  const weekStart = getProgramWeekStartProgramDay(params.weekNumber);

  for (let offset = 0; offset < 7; offset += 1) {
    const programDay = weekStart + offset;
    const dayInfo = buildProgramDayInfoForProgramDay(
      { startDate: params.enrollment.startDate },
      programDay,
    );
    if (dayInfo.dayOfWeek === 7) {
      console.log(`Day ${programDay}: Sunday rest`);
      continue;
    }

    const tasks = getDailyPlan(params.planInput, dayInfo, {
      activeTracks: params.activeTracks,
    });
    const trackTasks = tasks.filter((task) => task.type === "track");
    if (trackTasks.length === 0 && tasks.length === 0) {
      continue;
    }

    console.log(`Day ${programDay} (dow ${dayInfo.dayOfWeek}):`);
    for (const task of tasks) {
      const marker = task.type === "track" ? " [TRACK]" : "";
      console.log(`  - ${task.title}${marker}: ${task.target.slice(0, 90)}`);
    }
  }
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    include: { programEnrollment: true },
  });

  if (!user?.programEnrollment) {
    throw new Error(`No program enrollment found for ${TARGET_EMAIL}`);
  }

  const enrollment = user.programEnrollment;
  console.log(
    `Enrollment ${enrollment.id} for ${TARGET_EMAIL} (start ${enrollment.startDate?.toISOString().slice(0, 10) ?? "not set"})`,
  );

  const now = new Date();
  for (const trackKey of ["arm_care", "catcher"] as const) {
    await prisma.enrollmentTrack.upsert({
      where: {
        enrollmentId_trackKey: {
          enrollmentId: enrollment.id,
          trackKey,
        },
      },
      create: {
        enrollmentId: enrollment.id,
        trackKey,
        active: true,
        startedAt: now,
      },
      update: {
        active: true,
        startedAt: now,
      },
    });
  }

  const planInput = toEnrollmentPlanInput(enrollment);
  if (!planInput || !enrollment.startDate) {
    throw new Error("Enrollment plan input or start date missing.");
  }

  const activeTracks = await loadActiveTracks(enrollment.id, enrollment.startDate);

  const todayInfo = getProgramDay({ startDate: enrollment.startDate });
  const currentWeek =
    todayInfo.weekNumber > 0 && todayInfo.weekNumber <= 12 ? todayInfo.weekNumber : 1;

  printWeekPlan({
    label: "This week",
    weekNumber: currentWeek,
    enrollment,
    planInput,
    activeTracks,
  });

  printWeekPlan({
    label: "Week 6 sample",
    weekNumber: 6,
    enrollment,
    planInput,
    activeTracks,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
