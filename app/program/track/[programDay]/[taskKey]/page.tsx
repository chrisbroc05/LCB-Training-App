import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ProgramTrackChecklist from "@/app/program/track/[programDay]/[taskKey]/ProgramTrackChecklist";
import { authOptions } from "@/lib/auth";
import { findDailyTask } from "@/lib/program-daily-plan";
import {
  buildOverridesForWeekAndDay,
  loadEnrollmentPlanOverrideBundle,
} from "@/lib/program-plan-overrides-server";
import {
  buildProgramDayInfoForProgramDay,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import { prisma } from "@/lib/prisma";

type ProgramTrackPageProps = {
  params: Promise<{ programDay: string; taskKey: string }>;
};

export default async function ProgramTrackPage({ params }: ProgramTrackPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?redirect=%2Fdashboard");
  }

  const { programDay: programDayParam, taskKey } = await params;
  const programDay = Number(programDayParam);
  if (!Number.isFinite(programDay) || programDay <= 0) {
    redirect("/dashboard");
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment?.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  const planInput = toEnrollmentPlanInput(enrollment);
  if (!planInput) {
    redirect("/dashboard");
  }

  const dayInfo = buildProgramDayInfoForProgramDay(
    { startDate: enrollment.startDate },
    programDay,
  );
  const overrideBundle = await loadEnrollmentPlanOverrideBundle(
    enrollment.id,
    enrollment.startDate,
  );
  const overrides = buildOverridesForWeekAndDay(
    overrideBundle,
    dayInfo.weekNumber,
    programDay,
  );
  const decodedKey = decodeURIComponent(taskKey);
  const task = findDailyTask(planInput, dayInfo, decodedKey, overrides);
  if (!task || task.type !== "track" || !task.trackExercises?.length) {
    redirect("/dashboard");
  }

  const completion = await prisma.taskCompletion.findUnique({
    where: {
      enrollmentId_programDay_taskKey: {
        enrollmentId: enrollment.id,
        programDay,
        taskKey: task.key,
      },
    },
  });

  return (
    <div className="min-h-screen bg-black">
      <ProgramTrackChecklist
        programDay={programDay}
        taskKey={task.key}
        title={task.title}
        safetyNote={task.trackSafetyNote ?? ""}
        equipmentNote={task.trackEquipmentNote}
        equipmentNoteUrl={task.trackEquipmentNoteUrl}
        equipment={task.targetDetail ?? ""}
        exercises={task.trackExercises}
        drills={task.drills?.map((drill) => ({ title: drill.title, href: drill.href }))}
        initialNote={completion?.note ?? ""}
        initialCompleted={Boolean(completion)}
      />
    </div>
  );
}
