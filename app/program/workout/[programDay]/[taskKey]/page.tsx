import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ProgramWorkoutChecklist from "@/app/program/workout/[programDay]/[taskKey]/ProgramWorkoutChecklist";
import { authOptions } from "@/lib/auth";
import { findDailyTask } from "@/lib/program-daily-plan";
import {
  buildProgramDayInfoForProgramDay,
  toEnrollmentPlanInput,
} from "@/lib/program-today-server";
import { getWorkout } from "@/lib/workout-program-training";
import { prisma } from "@/lib/prisma";

type ProgramWorkoutPageProps = {
  params: Promise<{ programDay: string; taskKey: string }>;
};

export default async function ProgramWorkoutPage({ params }: ProgramWorkoutPageProps) {
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
  const task = findDailyTask(planInput, dayInfo, decodeURIComponent(taskKey));
  if (!task?.workout) {
    redirect("/dashboard");
  }

  const workout = getWorkout(
    task.workout.category,
    task.workout.ageGroup,
    task.workout.week,
    task.workout.workoutId,
  );

  if (!workout) {
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

  const showBodyweightNote =
    task.type === "strength" &&
    !planInput.equipment.includes("weights_gym") &&
    (planInput.ageGroup === "AGE_12_15" || planInput.ageGroup === "AGE_16_18");

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <ProgramWorkoutChecklist
        programDay={programDay}
        taskKey={task.key}
        workout={workout}
        inSeasonNote={task.inSeasonNote}
        showBodyweightNote={showBodyweightNote}
        initialNote={completion?.note ?? ""}
        initialCompleted={Boolean(completion)}
      />
    </div>
  );
}
