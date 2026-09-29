import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import VideoLibrary from "@/app/dashboard/VideoLibrary";
import DrillLibraryErrorBoundary from "@/app/drill-library/DrillLibraryErrorBoundary";
import DrillLibraryMobileResources from "@/app/drill-library/DrillLibraryMobileResources";
import DrillLibraryVideoSection from "@/app/drill-library/DrillLibraryVideoSection";
import DrillProgramUpsellLine from "@/app/drill-library/DrillProgramUpsellLine";
import GrantedDrillsPanel from "@/app/drill-library/GrantedDrillsPanel";
import { isDrillGrantedToUser } from "@/lib/drill-library-access";
import { loadUserGrantedDrillIds } from "@/lib/drill-library-access-server";
import {
  allDrillLibraryVideos,
  getDrillLibraryVideoById,
  getDrillLibraryVideosByIds,
} from "@/lib/drill-library-videos";
import { canAccessDrillLibrary, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { fetchVimeoThumbnailMap } from "@/lib/vimeo-oembed";

type DrillLibraryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DrillLibraryPage({ searchParams }: DrillLibraryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialDrillId =
    typeof resolvedSearchParams.drill === "string" ? resolvedSearchParams.drill : undefined;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const redirectTarget = initialDrillId
      ? `/drill-library?drill=${encodeURIComponent(initialDrillId)}`
      : "/drill-library";
    redirect(`/auth?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });
  const membershipTier = (user?.membershipTier ?? "FREE") as DatabaseTier;
  const hasFullLibraryAccess = canAccessDrillLibrary(membershipTier);
  const grantedDrillIds = hasFullLibraryAccess ? [] : await loadUserGrantedDrillIds(session.user.id);
  const showProgramUpsell = membershipTier === "FREE";

  if (!hasFullLibraryAccess) {
    if (initialDrillId && isDrillGrantedToUser(initialDrillId, grantedDrillIds)) {
      const allowedVideos = getDrillLibraryVideosByIds([initialDrillId]);
      const thumbnailMap = await fetchVimeoThumbnailMap(allowedVideos.map((video) => video.url));

      return (
        <>
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
              <h1 className="text-2xl font-semibold text-zinc-100">Your Coach-Picked Drill</h1>
              <p className="mt-2 text-sm text-zinc-300">
                This drill came from your coaching breakdown. The full library stays locked until you
                upgrade.
              </p>
              <DrillLibraryErrorBoundary>
                <VideoLibrary
                  thumbnailMap={thumbnailMap}
                  initialDrillId={initialDrillId}
                  allowedVideos={allowedVideos}
                  showProgramUpsell={showProgramUpsell}
                />
              </DrillLibraryErrorBoundary>
              {showProgramUpsell ? (
                <div className="hidden md:block">
                  <DrillProgramUpsellLine />
                </div>
              ) : null}
              <p className="mt-6 text-sm text-zinc-400">
                <Link href="/profile" className="font-semibold text-[#52B788] underline underline-offset-2">
                  Back to your breakdown
                </Link>
              </p>
            </section>
          </div>
        </>
      );
    }

    if (initialDrillId && !getDrillLibraryVideoById(initialDrillId)) {
      return (
        <LockedFeaturePanel
          title="Drill Not Found"
          description="That drill link is invalid or no longer available."
          message="Open the drills from your latest coaching breakdown email, or upgrade for full library access."
          upgradeLabel="See Upgrade Options"
          upgradeHref="/upgrade"
        />
      );
    }

    if (initialDrillId) {
      return (
        <LockedFeaturePanel
          title="Drill Library"
          description="This drill is not attached to one of your coaching breakdowns."
          message="You can open drills Coach Broc picked for your submissions. The full drill library is available with The Playbook or the 12-Week Coaching Program."
          upgradeLabel="See Upgrade Options"
          upgradeHref="/upgrade"
        />
      );
    }

    if (grantedDrillIds.length > 0) {
      return <GrantedDrillsPanel grantedDrillIds={grantedDrillIds} />;
    }

    return (
      <LockedFeaturePanel
        title="Drill Library"
        description="Hitting, fielding, and mindset drill videos to support your training routine."
        message="The drill library is available with The Playbook ($59) or the 12-Week Coaching Program. After Coach Broc responds to a submission, any drills he picks for you will open here."
        upgradeLabel="See Upgrade Options"
        upgradeHref="/upgrade?reason=basic-required"
      />
    );
  }

  const thumbnailMap = await fetchVimeoThumbnailMap(
    allDrillLibraryVideos.map((video) => video.url),
  );

  return (
    <>
      <div className="px-4 pt-4 md:hidden">
        <h1 className="text-2xl font-bold text-white">Train</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Filter drills by category and open any video in a full-width player.
        </p>
      </div>

      <div className="mx-auto hidden w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:block md:py-20">
        <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
          <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Drill Library</h1>
          <p className="mt-2 text-zinc-300">
            Browse hitting, fielding, and mindset drills. Click any video to open the full player.
          </p>
        </section>

        <DrillLibraryErrorBoundary>
          <VideoLibrary thumbnailMap={thumbnailMap} initialDrillId={initialDrillId} />
        </DrillLibraryErrorBoundary>
      </div>

      <div className="md:hidden">
        <DrillLibraryErrorBoundary>
          <DrillLibraryVideoSection thumbnailMap={thumbnailMap} initialDrillId={initialDrillId} />
        </DrillLibraryErrorBoundary>
        <DrillLibraryMobileResources membershipTier={membershipTier} />
      </div>
    </>
  );
}
