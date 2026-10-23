import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import PlaybookWorkoutsUpgradeCard from "@/app/account/downloads/PlaybookWorkoutsUpgradeCard";
import ResourceGuideCard from "@/app/resources/ResourceGuideCard";
import WorkoutProgramsSection from "@/app/resources/WorkoutProgramsSection";
import {
  canAccessMemberDownloadsPage,
  canAccessWorkoutPrograms,
  type DatabaseTier,
} from "@/lib/membership";
import { workoutResourceGroups } from "@/lib/workout-resources";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { prisma } from "@/lib/prisma";

export default async function AccountDownloadsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?redirect=/account/downloads");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: userAccessSelect,
  });

  if (!user) {
    redirect("/auth");
  }

  const membershipTier = (user.membershipTier ?? "FREE") as DatabaseTier;
  const entitlements = toAccessUserFields(user);

  if (!canAccessMemberDownloadsPage(membershipTier)) {
    return (
      <LockedFeaturePanel
        title="My Downloads"
        description="Download workout programs and bonus guides included with your membership."
        message="Downloads are available on Basic and 12-Week Program memberships. Upgrade to Basic or above to unlock Playbook guides."
        upgradeLabel="Upgrade to Basic or Above"
        upgradeHref="/upgrade?reason=basic-required"
      />
    );
  }

  const showFullWorkoutPdfs = canAccessWorkoutPrograms(
    membershipTier,
    user.playbookLegacyAccess,
  );
  const bonusResources = workoutResourceGroups.flatMap((group) => group.resources);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">My Downloads</h1>
        <p className="mt-2 text-zinc-300">
          Workout programs and bonus guides included with your membership. Looking for more? Visit{" "}
          <a href="/resources" className="text-[#52B788] underline">
            Free + Paid Resources
          </a>
          .
        </p>
      </section>

      {showFullWorkoutPdfs ? <WorkoutProgramsSection /> : <PlaybookWorkoutsUpgradeCard />}

      <section className="mt-10 border-t border-[#18243a] pt-8">
        <div className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Bonus Resources</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Guides and workbooks that apply to every athlete regardless of age group.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {bonusResources.map((resource) => (
              <ResourceGuideCard key={resource.filename} resource={resource} entitlements={entitlements} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
