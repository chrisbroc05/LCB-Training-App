import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  databaseTierToKey,
  membershipTiers,
  tierRank,
  type DatabaseTier,
  type TierKey,
} from "@/lib/membership";

type Resource = {
  title: string;
  accessTier: TierKey;
  description: string;
};

type VideoLibraryItem = {
  title: string;
  url: string;
};

const resources: Resource[] = [
  {
    title: "Full Drill Library",
    accessTier: "basic",
    description: "Progressive drill plans for contact, power, and timing.",
  },
  {
    title: "Weekly Swing Analysis Feedback",
    accessTier: "pro",
    description: "One detailed coach review each week with specific adjustments.",
  },
  {
    title: "Priority Feedback + Group Calls",
    accessTier: "elite",
    description: "Fast turnaround feedback and monthly live virtual group coaching.",
  },
];

const hittingVideos: VideoLibraryItem[] = [
  { title: "Coil into your load", url: "https://player.vimeo.com/video/1200422510" },
  { title: "Recreate this feeling", url: "https://player.vimeo.com/video/1200422513" },
  { title: "Med ball & tee combo #1", url: "https://player.vimeo.com/video/1200422511" },
  { title: "Med ball & tee combo #2", url: "https://player.vimeo.com/video/1200422512" },
  { title: "Stop casting your hands", url: "https://player.vimeo.com/video/1200422514" },
  { title: "Lead arm drill", url: "https://player.vimeo.com/video/1200422515" },
  { title: "Slot position", url: "https://player.vimeo.com/video/1200422517" },
  { title: "Posture work", url: "https://player.vimeo.com/video/1200422516" },
  { title: "Don't drift in your load", url: "https://player.vimeo.com/video/1200422500" },
];

const fieldingVideos: VideoLibraryItem[] = [
  { title: "Do these everyday", url: "https://player.vimeo.com/video/1200425708" },
  {
    title: "4 drills you can do with just a glove, ball and bucket",
    url: "https://player.vimeo.com/video/1200425698",
  },
  { title: "Make plays on the run", url: "https://player.vimeo.com/video/1200425704" },
  { title: "Body control", url: "https://player.vimeo.com/video/1200425706" },
  {
    title: "Timing and getting around the baseball",
    url: "https://player.vimeo.com/video/1200425705",
  },
  {
    title: "3 drills to improve footwork and timing",
    url: "https://player.vimeo.com/video/1200425707",
  },
];

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const checkoutStatus =
    typeof resolvedSearchParams.checkout === "string" ? resolvedSearchParams.checkout : null;

  const membershipTier = (session.user.membershipTier ?? "BASIC") as DatabaseTier;
  const userTier = databaseTierToKey[membershipTier];
  const currentTier = membershipTiers.find((tier) => tier.key === userTier) ?? membershipTiers[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-3xl font-semibold text-zinc-100">Member Dashboard</h1>
        <p className="mt-2 text-zinc-300">
          You are logged in as a <span className="font-semibold text-[#98b144]">{currentTier.name}</span>{" "}
          member. Your library and coaching tools are unlocked based on this plan.
        </p>

        <div className="mt-5 inline-flex rounded-full border border-[#2b3650] bg-black px-4 py-2 text-sm font-medium text-[#98b144]">
          Active membership: {currentTier.name}
        </div>
      </section>

      {checkoutStatus === "success" && (
        <section className="mt-6 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 px-5 py-4 text-sm text-[#bafccf]">
          Payment successful. Your membership is active and your dashboard access has been updated.
        </section>
      )}

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {resources.map((resource) => {
          const hasAccess = tierRank[userTier] >= tierRank[resource.accessTier];

          return (
            <article
              key={resource.title}
              className={`rounded-2xl border p-6 ${
                hasAccess
                  ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                  : "border-[#18243a] bg-[#0b1324]/80"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-zinc-100">{resource.title}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    hasAccess
                      ? "bg-[#22c55e]/20 text-[#9df3bd]"
                      : "bg-[#24314a] text-zinc-200"
                  }`}
                >
                  {hasAccess
                    ? "Unlocked"
                    : `Requires ${resource.accessTier.charAt(0).toUpperCase()}${resource.accessTier.slice(1)}`}
                </span>
              </div>
              <p className="mt-3 text-zinc-300">{resource.description}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">Hitting Library</h2>
          <p className="mt-2 text-zinc-300">
            Drill demonstrations for swing mechanics, load, posture, and bat path.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {hittingVideos.map((video) => (
              <article
                key={video.url}
                className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4"
              >
                <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
                  <div className="aspect-video w-full">
                    <iframe
                      src={video.url}
                      title={video.title}
                      className="h-full w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-100">{video.title}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">Fielding Library</h2>
          <p className="mt-2 text-zinc-300">
            Defensive drill work for control, timing, footwork, and making game-speed plays.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {fieldingVideos.map((video) => (
              <article
                key={video.url}
                className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4"
              >
                <div className="overflow-hidden rounded-xl border border-[#2b3650] bg-black">
                  <div className="aspect-video w-full">
                    <iframe
                      src={video.url}
                      title={video.title}
                      className="h-full w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-100">{video.title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
