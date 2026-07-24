import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardCoachingCard from "@/app/dashboard/DashboardCoachingCard";
import DashboardMembershipCard from "@/app/dashboard/DashboardMembershipCard";
import DashboardUpgradeSection from "@/app/dashboard/DashboardUpgradeSection";
import MonthlyGoalProgressCard from "@/app/dashboard/MonthlyGoalProgressCard";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
} from "@/lib/coaching-submissions";
import { getCurrentMonthGoalCheckin } from "@/lib/goal-check-in";
import {
  canAccessCoachingNav,
  canAccessDrillLibrary,
  canAccessWorkoutPrograms,
  databaseTierToKey,
  isManualMembershipMember,
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

function getFirstName(name: string | null | undefined, email: string | null | undefined) {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName.split(/\s+/)[0];
  }

  return email?.split("@")[0] || "Member";
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
    links.push({
      href: "/goal-setting",
      label: "Goal Check-In",
      description: "Submit your monthly goals for personal review from Coach Broc.",
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
      assessmentCallBooked: true,
      assessmentCallDate: true,
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
  const firstName = getFirstName(userRecord.name, session.user.email);
  const quickLinks = getQuickLinks(
    membershipTier,
    membershipTier === "FREE" && !freeSubmissionUsed,
  );
  const isPaidMember = membershipTier !== "FREE";
  const hasSubscription = Boolean(userRecord.stripeSubscriptionId);
  const isManualMembership = isManualMembershipMember(
    membershipTier,
    userRecord.stripeSubscriptionId,
  );
  const currentMonthGoalCheckin = canAccessCoachingNav(membershipTier)
    ? await getCurrentMonthGoalCheckin(session.user.id)
    : null;

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
          Hey {firstName}, welcome back
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

      <div className="mt-8 space-y-4 sm:space-y-5">
        <DashboardMembershipCard
          membershipTier={membershipTier}
          isPaidMember={isPaidMember}
          isManualMembership={isManualMembership}
          subscriptionCurrentPeriodEnd={userRecord.subscriptionCurrentPeriodEnd}
          subscriptionCancelAtPeriodEnd={userRecord.subscriptionCancelAtPeriodEnd}
        />

        <DashboardCoachingCard
          membershipTier={membershipTier}
          coachingAvailability={coachingAvailability}
          freeSubmissionUsed={freeSubmissionUsed}
          assessmentCallBooked={userRecord.assessmentCallBooked}
          assessmentCallDate={userRecord.assessmentCallDate}
        />
      </div>

      {canAccessCoachingNav(membershipTier) ? (
        <section className="mt-10 border-t border-[#18243a] pt-10 sm:mt-12 sm:pt-12">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Monthly Goal Progress</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Track and complete your goals for this month without leaving the dashboard.
            </p>
          </div>
          <MonthlyGoalProgressCard
            hasCheckin={Boolean(currentMonthGoalCheckin)}
            goals={currentMonthGoalCheckin?.goals ?? []}
          />
        </section>
      ) : null}

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
              View all{` ->`}
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
                      {submission.playerName} - Submitted {formatDateTime(submission.createdAt)}
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
                      {submission.playerName} - Responded{" "}
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
