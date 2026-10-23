import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUpgradeLabelForLevel } from "@/lib/membership-levels-shared";
import { canViewStarterWorkoutsInApp } from "@/lib/membership";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { STARTER_WORKOUT_PROGRAMS } from "@/lib/starter-workouts-in-app-shared";
import { prisma } from "@/lib/prisma";

export default async function StarterWorkoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?redirect=%2Fworkouts%2Fstarters");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userAccessSelect,
  });
  const access = user ? toAccessUserFields(user) : null;
  const allowed = access && canViewStarterWorkoutsInApp(
    access.membershipTier,
    access.playbookLegacyAccess,
    access.membershipLevel,
    access.membershipLevelExpiresAt,
  );

  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-100">4-Week Starter Workouts</h1>
        <p className="mt-3 text-zinc-300">
          {getUpgradeLabelForLevel("CORE")} Full workout programs unlock with an upgraded membership.
        </p>
        <Link href="/upgrade" className="mt-6 inline-block font-semibold text-[#52B788] underline">
          See membership options
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-100">4-Week Starter Workouts</h1>
      <p className="mt-2 text-sm text-zinc-400">
        View your starter programs in the app. PDF downloads are not included on Core.
      </p>
      <ul className="mt-8 space-y-4">
        {STARTER_WORKOUT_PROGRAMS.map((program) => (
          <li key={program.key}>
            <Link
              href={`/workouts/starters/${program.key}`}
              className="block rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 p-5 transition hover:border-[#52B788]"
            >
              <p className="font-semibold text-zinc-100">{program.title}</p>
              <p className="mt-2 text-sm text-zinc-400">{program.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
