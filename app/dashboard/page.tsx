import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import VideoLibrary from "@/app/dashboard/VideoLibrary";
import { prisma } from "@/lib/prisma";
import {
  databaseTierToKey,
  hasTierAccess,
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
    title: "One Free Submission",
    accessTier: "free",
    description: "Free members can submit one swing analysis OR one mental game support request.",
  },
  {
    title: "Hitting + Fielding Video Library",
    accessTier: "basic",
    description: "Progressive drill plans for contact, power, and timing.",
  },
  {
    title: "Mindset Video Library",
    accessTier: "basic",
    description: "Mental performance lessons to build confidence, focus, and composure.",
  },
  {
    title: "Unlimited Swing Analysis + Mental Game Support",
    accessTier: "pro",
    description: "Submit swing and mental game forms anytime for direct coaching support.",
  },
  {
    title: "Priority Feedback + Monthly Group Call",
    accessTier: "elite",
    description: "Get top-priority swing and mental game feedback plus monthly live group call access.",
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
  const upgradeStatus =
    typeof resolvedSearchParams.upgrade === "string" ? resolvedSearchParams.upgrade : null;

  const membershipTier = (session.user.membershipTier ?? "FREE") as DatabaseTier;
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { freeSubmissionUsed: true },
  });
  const userTier = databaseTierToKey[membershipTier];
  const currentTier = membershipTiers.find((tier) => tier.key === userTier) ?? membershipTiers[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Member Dashboard</h1>
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

      {upgradeStatus === "pro-required" && (
        <section className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
          Pro or Elite membership is required to access swing analysis and mental game support
          forms.
        </section>
      )}
      {upgradeStatus === "free-submission-used" && (
        <section className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
          Your one free submission has already been used. Upgrade to continue with additional
          submissions and unlocked training content.
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">
        {resources.map((resource) => {
          const hasAccess = tierRank[userTier] >= tierRank[resource.accessTier];

          return (
            <article
              key={resource.title}
              className={`rounded-2xl border p-4 sm:p-6 ${
                hasAccess
                  ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                  : "border-[#18243a] bg-[#0b1324]/80"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold leading-tight text-zinc-100 sm:text-xl">{resource.title}</h2>
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

      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">Coaching Submissions</h2>
        <p className="mt-2 text-zinc-300">
          Free members get one total submission. Pro and Elite members get unlimited submissions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {hasTierAccess(userTier, "pro") || (userTier === "free" && !userRecord?.freeSubmissionUsed) ? (
            <>
              <Link
                href="/swing-analysis"
                className="w-full rounded-full bg-[#22c55e] px-5 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
              >
                Swing Analysis Form
              </Link>
              <Link
                href="/mental-game"
                className="w-full rounded-full bg-[#22c55e] px-5 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
              >
                Mental Game Support Form
              </Link>
            </>
          ) : (
            <Link
              href="/upgrade"
              className="w-full rounded-full border border-[#2b3650] bg-black/40 px-5 py-2.5 text-center text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144] sm:w-auto"
            >
              Upgrade to continue submissions
            </Link>
          )}
        </div>
      </section>

      {hasTierAccess(userTier, "basic") ? (
        <VideoLibrary />
      ) : (
        <section className="mt-10 rounded-2xl border border-[#2b3650] bg-[#0b1324]/80 p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Drill Libraries</h2>
          <p className="mt-2 text-zinc-300">
            The hitting, fielding, and mindset video libraries are locked on the Free tier.
          </p>
          <div className="mt-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Upgrade to <span className="font-semibold">Basic</span> or above to unlock the full drill
            library and continue your development.
          </div>
          <div className="mt-5">
            <Link
              href="/upgrade"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] sm:w-auto"
            >
              Upgrade Membership
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
