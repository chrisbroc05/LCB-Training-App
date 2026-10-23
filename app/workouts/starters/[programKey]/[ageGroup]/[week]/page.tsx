import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewStarterWorkoutsInApp } from "@/lib/membership";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { getStarterWorkoutProgram } from "@/lib/starter-workouts-in-app-shared";
import { getWorkout } from "@/lib/workout-program-training";
import type { WorkoutAgeGroup } from "@/lib/workout-program-types";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ programKey: string; ageGroup: string; week: string }>;
};

const AGE_GROUPS = new Set(["8-11", "12-15", "16-18"]);

export default async function StarterWorkoutWeekPage({ params }: PageProps) {
  const { programKey, ageGroup, week: weekParam } = await params;
  const program = getStarterWorkoutProgram(programKey);
  const week = Number(weekParam);
  if (!program || !AGE_GROUPS.has(ageGroup) || !Number.isFinite(week) || week < 1 || week > 4) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userAccessSelect,
  });
  const access = user ? toAccessUserFields(user) : null;
  if (
    !access ||
    !canViewStarterWorkoutsInApp(
      access.membershipTier,
      access.playbookLegacyAccess,
      access.membershipLevel,
      access.membershipLevelExpiresAt,
    )
  ) {
    redirect("/workouts/starters");
  }

  const workout = getWorkout(
    program.category,
    ageGroup as WorkoutAgeGroup,
    week,
    "A",
    null,
  );

  if (!workout) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-24">
      <Link
        href={`/workouts/starters/${programKey}`}
        className="text-sm font-semibold text-[#52B788]"
      >
        Back to {program.title}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-100">
        {program.title} - Ages {ageGroup} - Week {week}
      </h1>
      <p className="mt-2 text-lg font-medium text-zinc-200">{workout.title}</p>
      <div className="mt-8 space-y-6">
        {workout.sections.map((section) => (
          <div key={section.name} className="rounded-xl border border-[#2b3650] p-4">
            <h2 className="font-semibold text-[#52B788]">{section.name}</h2>
            <ul className="mt-3 space-y-3 text-sm text-zinc-200">
              {section.exercises.map((exercise) => (
                <li key={`${section.name}-${exercise.name}`}>
                  <span className="font-medium">{exercise.name}</span>
                  {exercise.sets ? ` - ${exercise.sets} x ${exercise.repsOrTime}` : ` - ${exercise.repsOrTime}`}
                  {exercise.formCue ? (
                    <p className="mt-1 text-zinc-400">{exercise.formCue}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
