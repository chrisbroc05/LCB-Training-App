import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import CoachingSubmissionQuota from "@/app/CoachingSubmissionQuota";
import DashboardUpgradeSection from "@/app/dashboard/DashboardUpgradeSection";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
} from "@/lib/coaching-submissions";
import {
  canAccessCoachingNav,
  canAccessDrillLibrary,
  canAccessWorkoutPrograms,
  databaseTierToKey,
  formatDatabaseTierLabel,
  membershipTiers,
  type DatabaseTier,
} from "@/lib/membership";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type QuickLink = {
  href: string;
  label: string;
  description: string;
};

function formatTierLabel(tier: DatabaseTier) {
  return formatDatabaseTierLabel(tier);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getQuickLinks(membershipTier: DatabaseTier, hasFreeSubmissionRemaining: boolean): QuickLink[] {
  const links: QuickLink[] = [];

  if (canAccessDrillLibrary(membershipTier)) {
    links.push({
      href: "/drill-library",
      label: "Drill Library",
      description: "Hitting, fielding, and mindset drill videos.",
    });
  }

  if (canAccessWorkoutPrograms(membershipTier)) {
    links.push({
      href: "/resources",
      label: "Resources",
      description: "Download strength, speed, and mobility programs.",
    });
  }

  if (membershipTier === "MEMORABLE" || membershipTier === "ELITE") {
    links.push({
      href: "/coaching-submissions",
      label: "Coaching Submissions",
      description: "Submit swing videos or mindset requests for coach feedback.",
    });
  }

  if (membershipTier === "FREE" && hasFreeSubmissionRemaining) {
    links.push({
      href: "/coaching-submissions",
      label: "Coaching Submissions",
      description: "Use your one free submission for swing video or mindset support.",
    });
  }

  if (canAccessCoachingNav(membershipTier)) {
    links.push({
      href: "/profile",
      label: "My Submissions",
      description: "Track coaching requests and coach responses.",
    });
  }

  links.push({
    href: "/settings",
    label: "Account",
    description: "Manage membership, billing, and account details.",
  });

  if (membershipTier === "FREE" || membershipTier === "BASIC") {
    links.push({
      href: "/upgrade",
      label: "Upgrade Membership",
      description: "Unlock more training content and coaching support.",
    });
  }

  return links;
}

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
    select: {
      name: true,
      freeSubmissionUsed: true,
      coachingSubmissionsUsedThisMonth: true,
      coachingSubmissionPeriod: true,
      eliteRolloverCredits: true,
      membershipTier: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionCancelAtPeriodEnd: true,
      stripeSubscriptionId: true,
    },
  });

  if (!userRecord) {
    redirect("/auth");
  }

  const membershipTier = userRecord.membershipTier as DatabaseTier;
  const coachingFields = await ensureCoachingSubmissionPeriod(session.user.id);
  const coachingAvailability = coachingFields
    ? getCoachingSubmissionAvailability(coachingFields)
    : null;
  const freeSubmissionUsed = userRecord.freeSubmissionUsed;
  const userTier = databaseTierToKey[membershipTier];
  const currentTier = membershipTiers.find((tier) => tier.key === userTier) ?? membershipTiers[0];
  const displayName = userRecord.name?.trim() || session.user.email?.split("@")[0] || "Member";
  const quickLinks = getQuickLinks(
    membershipTier,
    membershipTier === "FREE" && !freeSubmissionUsed,
  );
  const isPaidMember = membershipTier !== "FREE";
  const hasSubscription = Boolean(userRecord.stripeSubscriptionId);
  const showFreeSubmissionCard = membershipTier === "FREE";

  const pendingSubmissions = canAccessCoachingNav(membershipTier)
    ? await Promise.all([
        prisma.swingAnalysisSubmission.findMany({
          where: {
            userId: session.user.id,
            status: { in: ["PENDING", "REVIEWING"] },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, createdAt: true, playerName: true },
        }),
        prisma.mentalGameSubmission.findMany({
          where: {
            userId: session.user.id,
            status: { in: ["PENDING", "REVIEWING"] },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, createdAt: true, playerName: true },
        }),
      ]).then(([swing, mental]) => {
        const items = [
          ...swing.map((item) => ({
            id: item.id,
            type: "swing" as const,
            createdAt: item.createdAt,
            playerName: item.playerName,
          })),
          ...mental.map((item) => ({
            id: item.id,
            type: "mental" as const,
            createdAt: item.createdAt,
            playerName: item.playerName,
          })),
        ];
        return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
      })
    : [];

  const recentResponses = canAccessCoachingNav(membershipTier)
    ? await Promise.all([
        prisma.swingAnalysisSubmission.findMany({
          where: {
            userId: session.user.id,
            status: "COMPLETED",
            respondedAt: { not: null },
          },
          orderBy: { respondedAt: "desc" },
          take: 3,
          select: { id: true, respondedAt: true, playerName: true },
        }),
        prisma.mentalGameSubmission.findMany({
          where: {
            userId: session.user.id,
            status: "COMPLETED",
            respondedAt: { not: null },
          },
          orderBy: { respondedAt: "desc" },
          take: 3,
          select: { id: true, respondedAt: true, playerName: true },
        }),
      ]).then(([swing, mental]) => {
        const items = [
          ...swing.map((item) => ({
            id: item.id,
            type: "swing" as const,
            respondedAt: item.respondedAt!,
            playerName: item.playerName,
          })),
          ...mental.map((item) => ({
            id: item.id,
            type: "mental" as const,
            respondedAt: item.respondedAt!,
            playerName: item.playerName,
          })),
        ];
        return items.sort((a, b) => b.respondedAt.getTime() - a.respondedAt.getTime()).slice(0, 3);
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          Welcome back, {displayName}!
        </h1>
        <p className="mt-2 text-zinc-300">
          Your LCB Training home base. Jump into the tools included with your{" "}
          <span className="font-semibold text-[#98b144]">{currentTier.name}</span> membership.
        </p>
      </section>

      {checkoutStatus === "success" && (
        <section className="mt-6 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 px-5 py-4 text-sm text-[#bafccf]">
          Payment successful. Your membership is active and your dashboard access has been updated.
        </section>
      )}

      {(upgradeStatus === "memorable-required" || upgradeStatus === "pro-required") && (
        <section className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
          Memorable or Elite membership is required to access coaching submission forms.
        </section>
      )}
      {upgradeStatus === "free-submission-used" && (
        <section className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
          Your one free submission has already been used. Upgrade to continue with additional
          submissions and unlocked training content.
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Membership</h2>
          <div className="mt-3 inline-flex rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
            {formatTierLabel(membershipTier)}
          </div>
          {isPaidMember ? (
            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              <p>
                Next billing date:{" "}
                {formatDate(userRecord.subscriptionCurrentPeriodEnd)}
              </p>
              {userRecord.subscriptionCancelAtPeriodEnd ? (
                <p className="text-yellow-100">
                  Your subscription is set to cancel at the end of the current billing period.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-300">
              You are on the Free plan. Upgrade anytime to unlock the full drill library, resources,
              and coaching support.
            </p>
          )}
          <Link
            href="/settings"
            className="mt-4 inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144]"
          >
            Manage Membership
          </Link>
        </article>

        {showFreeSubmissionCard ? (
          <div className="grid gap-4 sm:gap-5">
            <article
              className={`rounded-2xl border p-4 sm:p-6 ${
                !freeSubmissionUsed
                  ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                  : "border-[#18243a] bg-[#0b1324]/80"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-100">One Free Submission</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    !freeSubmissionUsed
                      ? "bg-[#22c55e]/20 text-[#9df3bd]"
                      : "bg-[#24314a] text-zinc-200"
                  }`}
                >
                  {!freeSubmissionUsed ? "Available" : "Used"}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-300">
                Free members can submit one coaching submission.
              </p>
              {!freeSubmissionUsed ? (
                <Link
                  href="/coaching-submissions"
                  className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                >
                  Submit Coaching Submission
                </Link>
              ) : (
                <Link
                  href="/upgrade?reason=free-submission-used"
                  className="mt-4 inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144]"
                >
                  Upgrade to continue
                </Link>
              )}
            </article>

            <article className="rounded-2xl border border-[#22c55e]/50 bg-[#22c55e]/10 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-100">Free Player Assessment Call</h2>
                <span className="rounded-full bg-[#22c55e]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
                  Free
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-300">
                Book a free 20-minute video call with Coach Broc to discuss your player&apos;s goals
                and find the right training plan for their development.
              </p>
              <a
                href="https://calendly.com/chrisbroc05/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
              >
                Book Your Free Call
              </a>
            </article>
          </div>
        ) : membershipTier === "MEMORABLE" || membershipTier === "ELITE" ? (
          <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-100">Coaching Submissions</h2>
            {coachingAvailability ? (
              <div className="mt-3">
                <CoachingSubmissionQuota
                  availability={coachingAvailability}
                  membershipTier={membershipTier}
                />
              </div>
            ) : null}
            {coachingAvailability && coachingAvailability.canSubmit ? (
              <Link
                href="/coaching-submissions"
                className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
              >
                Go to Coaching Submissions
              </Link>
            ) : (
              <Link
                href={membershipTier === "MEMORABLE" ? "/upgrade" : "/settings"}
                className="mt-4 inline-flex rounded-full border border-[#2b3650] bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-[#7f9434] hover:text-[#98b144]"
              >
                {membershipTier === "MEMORABLE"
                  ? "Upgrade for more submissions"
                  : "View membership details"}
              </Link>
            )}
          </article>
        ) : membershipTier === "BASIC" ? (
          <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-100">Unlock Coaching Submissions</h2>
            <p className="mt-3 text-sm text-zinc-300">
              Upgrade to Memorable to submit swing videos and mindset requests for coach feedback.
            </p>
            <Link
              href="/upgrade?reason=memorable-required"
              className="mt-4 inline-flex rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Upgrade to Memorable
            </Link>
          </article>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">Quick Links</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 transition hover:border-[#22c55e]/40 hover:bg-[#0f1d34] sm:p-5"
            >
              <h3 className="text-base font-semibold text-zinc-100">{link.label}</h3>
              <p className="mt-2 text-sm text-zinc-400">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {canAccessCoachingNav(membershipTier) ? (
        <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">Coaching Submissions</h2>
            <Link
              href="/profile"
              className="text-sm font-medium text-[#98b144] transition hover:text-[#b5d84f]"
            >
              View all →
            </Link>
          </div>

          {pendingSubmissions.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-300">Awaiting coach response</p>
              <div className="mt-3 space-y-3">
                {pendingSubmissions.map((submission) => (
                  <Link
                    key={`${submission.type}-${submission.id}`}
                    href={`/profile?type=${submission.type}&id=${submission.id}`}
                    className="block rounded-xl border border-[#2b3650] bg-black/30 p-4 transition hover:border-[#3c4a68]"
                  >
                    <p className="text-sm font-semibold text-zinc-100">
                      Coaching Submissions
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {submission.playerName} · Submitted {formatDateTime(submission.createdAt)}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-[#24314a] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200">
                      Pending Review
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">No submissions awaiting coach response.</p>
          )}

          {recentResponses.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm font-medium text-zinc-300">Recent coach responses</p>
              <div className="mt-3 space-y-3">
                {recentResponses.map((submission) => (
                  <Link
                    key={`response-${submission.type}-${submission.id}`}
                    href={`/profile?type=${submission.type}&id=${submission.id}`}
                    className="block rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-4 transition hover:border-[#22c55e]/50"
                  >
                    <p className="text-sm font-semibold text-zinc-100">
                      Coaching Submissions
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {submission.playerName} · Responded{" "}
                      {formatDateTime(submission.respondedAt)}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-[#22c55e]/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9df3bd]">
                      Response Ready
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <DashboardUpgradeSection
        membershipTier={membershipTier}
        hasSubscription={hasSubscription}
      />
    </div>
  );
}
