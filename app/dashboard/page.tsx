import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import VideoLibrary from "@/app/dashboard/VideoLibrary";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import {
  canAccessDrillLibrary,
  canSubmitCoachingForms,
  databaseTierToKey,
  hasTierAccess,
  membershipTiers,
  type DatabaseTier,
  type TierKey,
} from "@/lib/membership";

type Resource = {
  id: string;
  title: string;
  description: string;
  requiredTierLabel: string;
  isUnlocked: (userTier: TierKey, freeSubmissionUsed: boolean) => boolean;
};

const resources: Resource[] = [
  {
    id: "free-submission",
    title: "One Free Submission",
    description: "Free members can submit one swing analysis OR one mental game support request.",
    requiredTierLabel: "Free",
    isUnlocked: (userTier, freeSubmissionUsed) => userTier === "free" && !freeSubmissionUsed,
  },
  {
    id: "drill-library",
    title: "Hitting + Fielding + Mindset Drill Library",
    description: "Progressive drill plans for contact, power, timing, defense, and mental performance.",
    requiredTierLabel: "Basic",
    isUnlocked: (userTier) => hasTierAccess(userTier, "basic"),
  },
  {
    id: "workout-programs",
    title: "Workout Programs",
    description: "All 9 downloadable strength, speed, and mobility programs by age group.",
    requiredTierLabel: "Basic",
    isUnlocked: (userTier) => hasTierAccess(userTier, "basic"),
  },
  {
    id: "unlimited-coaching",
    title: "Unlimited Swing Analysis + Mental Game Support",
    description: "Submit swing and mental game forms anytime for direct coaching support.",
    requiredTierLabel: "Pro",
    isUnlocked: (userTier) => hasTierAccess(userTier, "pro"),
  },
  {
    id: "elite-benefits",
    title: "Priority Feedback + Monthly Group Call",
    description: "Get top-priority swing and mental game feedback plus monthly live group call access.",
    requiredTierLabel: "Elite",
    isUnlocked: (userTier) => hasTierAccess(userTier, "elite"),
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
  if (isAdminEmail(session.user.email)) {
    redirect("/admin");
  }
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const checkoutStatus =
    typeof resolvedSearchParams.checkout === "string" ? resolvedSearchParams.checkout : null;
  const upgradeStatus =
    typeof resolvedSearchParams.upgrade === "string" ? resolvedSearchParams.upgrade : null;

  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { freeSubmissionUsed: true, membershipTier: true },
  });
  const membershipTier = (userRecord?.membershipTier ?? "FREE") as DatabaseTier;
  const freeSubmissionUsed = userRecord?.freeSubmissionUsed ?? false;
  const userTier = databaseTierToKey[membershipTier];
  const currentTier = membershipTiers.find((tier) => tier.key === userTier) ?? membershipTiers[0];
  const canSubmit = canSubmitCoachingForms(membershipTier, freeSubmissionUsed);

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
          const hasAccess = resource.isUnlocked(userTier, freeSubmissionUsed);

          return (
            <article
              key={resource.id}
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
                  {hasAccess ? "Unlocked" : `Requires ${resource.requiredTierLabel}`}
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
          Free members get one total submission (swing analysis or mental game support). Basic
          members do not include coaching submissions. Pro and Elite members get unlimited
          submissions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {canSubmit ? (
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
          ) : membershipTier === "BASIC" ? (
            <Link
              href="/upgrade?reason=pro-required"
              className="w-full rounded-full border border-[#2b3650] bg-black/40 px-5 py-2.5 text-center text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144] sm:w-auto"
            >
              Upgrade to Pro or Elite for coaching submissions
            </Link>
          ) : (
            <Link
              href="/upgrade?reason=free-submission-used"
              className="w-full rounded-full border border-[#2b3650] bg-black/40 px-5 py-2.5 text-center text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144] sm:w-auto"
            >
              Upgrade to continue submissions
            </Link>
          )}
        </div>
      </section>

      {canAccessDrillLibrary(membershipTier) ? (
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
              href="/upgrade?reason=basic-required"
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
