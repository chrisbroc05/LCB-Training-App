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

const introVideos = [
  {
    title: "Welcome to LCB Training - Who I am and my coaching philosophy",
    embedUrl: "https://player.vimeo.com/video/1199103395",
  },
  {
    title: "How the program works and what to expect",
    embedUrl: "https://player.vimeo.com/video/1199103402",
  },
  {
    title: "How to submit your swing for analysis",
    embedUrl: "https://player.vimeo.com/video/1199103401",
  },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const membershipTier = (session.user.membershipTier ?? "BASIC") as DatabaseTier;
  const userTier = databaseTierToKey[membershipTier];
  const currentTier = membershipTiers.find((tier) => tier.key === userTier) ?? membershipTiers[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-3xl font-semibold text-zinc-100">Start Here</h1>
        <p className="mt-2 text-zinc-300">
          Watch these quick intro videos first so you know exactly how to get the most out
          of your membership.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {introVideos.map((video) => (
            <article
              key={video.embedUrl}
              className="rounded-2xl border border-[#24314a] bg-black/40 p-4"
            >
              <div className="overflow-hidden rounded-xl border border-[#2b3650]">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  className="aspect-video w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <h2 className="mt-3 text-sm font-medium text-zinc-100">{video.title}</h2>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h2 className="text-3xl font-semibold text-zinc-100">Member Dashboard</h2>
        <p className="mt-2 text-zinc-300">
          You are logged in as a <span className="font-semibold text-[#98b144]">{currentTier.name}</span>{" "}
          member. Your library and coaching tools are unlocked based on this plan.
        </p>

        <div className="mt-5 inline-flex rounded-full border border-[#2b3650] bg-black px-4 py-2 text-sm font-medium text-[#98b144]">
          Active membership: {currentTier.name}
        </div>
      </section>

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
    </div>
  );
}
