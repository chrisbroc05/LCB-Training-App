import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LockedFeaturePanel from "@/app/LockedFeaturePanel";
import VideoLibrary from "@/app/dashboard/VideoLibrary";
import DrillLibraryErrorBoundary from "@/app/drill-library/DrillLibraryErrorBoundary";
import DrillLibraryMobileResources from "@/app/drill-library/DrillLibraryMobileResources";
import DrillLibraryVideoSection from "@/app/drill-library/DrillLibraryVideoSection";
import { allDrillLibraryVideos } from "@/lib/drill-library-videos";
import { canAccessDrillLibrary, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { fetchVimeoThumbnailMap } from "@/lib/vimeo-oembed";

export default async function DrillLibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });
  const membershipTier = (user?.membershipTier ?? "FREE") as DatabaseTier;

  if (!canAccessDrillLibrary(membershipTier)) {
    return (
      <LockedFeaturePanel
        title="Drill Library"
        description="Hitting, fielding, and mindset drill videos to support your training routine."
        message="The drill library is available on Basic, Memorable, and Elite memberships. Upgrade to Basic or above to unlock the full hitting, fielding, and mindset drill library built around real game situations."
        upgradeLabel="Upgrade to Basic or Above"
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
          <VideoLibrary thumbnailMap={thumbnailMap} />
        </DrillLibraryErrorBoundary>
      </div>

      <div className="md:hidden">
        <DrillLibraryErrorBoundary>
          <DrillLibraryVideoSection thumbnailMap={thumbnailMap} />
        </DrillLibraryErrorBoundary>
        <DrillLibraryMobileResources membershipTier={membershipTier} />
      </div>
    </>
  );
}
