import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewStarterWorkoutsInApp } from "@/lib/membership";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import {
  getStarterWorkoutProgram,
  STARTER_WORKOUT_AGE_GROUPS,
} from "@/lib/starter-workouts-in-app-shared";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ programKey: string }>;
};

export default async function StarterWorkoutProgramPage({ params }: PageProps) {
  const { programKey } = await params;
  const program = getStarterWorkoutProgram(programKey);
  if (!program) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth?redirect=${encodeURIComponent(`/workouts/starters/${programKey}`)}`);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/workouts/starters" className="text-sm font-semibold text-[#52B788]">
        Back to starters
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-100">{program.title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{program.description}</p>
      <div className="mt-8 space-y-6">
        {STARTER_WORKOUT_AGE_GROUPS.map((age) => (
          <div key={age.key} className="rounded-2xl border border-[#2b3650] p-5">
            <p className="font-semibold text-zinc-100">{age.label}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((week) => (
                <Link
                  key={week}
                  href={`/workouts/starters/${programKey}/${age.key}/${week}`}
                  className="rounded-full border border-[#52B788] px-4 py-2 text-sm font-semibold text-[#52B788]"
                >
                  Week {week}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
