import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChangeMembershipSection from "@/app/settings/ChangeMembershipSection";
import ChangePasswordSection from "@/app/settings/ChangePasswordSection";
import CancelSubscriptionButton from "@/app/settings/CancelSubscriptionButton";
import ManageBillingButton from "@/app/settings/ManageBillingButton";
import NotificationPreferencesSection from "@/app/settings/NotificationPreferencesSection";
import PlayerProfileSection from "@/app/settings/PlayerProfileSection";
import SettingsCard from "@/app/settings/SettingsCard";
import SettingsStatsSummary from "@/app/settings/SettingsStatsSummary";
import {
  settingsAccentTextClass,
  settingsBodyTextClass,
  settingsCardClass,
  settingsMutedTextClass,
  settingsPageStackClass,
  settingsPageTitleClass,
  settingsPrimaryButtonClass,
  settingsSectionDescriptionClass,
  settingsWarningTextClass,
} from "@/app/settings/settings-styles";
import {
  ensureCoachingSubmissionPeriod,
  getCoachingSubmissionAvailability,
} from "@/lib/coaching-submissions";
import {
  formatDatabaseTierLabel,
  isLifetimeBasicMember,
  type DatabaseTier,
} from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

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

async function getStripeBillingDate(params: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}) {
  if (!params.stripeSubscriptionId) {
    return null;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(params.stripeSubscriptionId);

    if (
      params.stripeCustomerId &&
      typeof subscription.customer === "string" &&
      subscription.customer !== params.stripeCustomerId
    ) {
      return null;
    }

    const subscriptionWithPeriod = subscription as unknown as { current_period_end?: number };
    if (typeof subscriptionWithPeriod.current_period_end === "number") {
      return new Date(subscriptionWithPeriod.current_period_end * 1000);
    }

    const itemPeriodEnds = subscription.items.data
      .map((item) => item.current_period_end)
      .filter((value): value is number => typeof value === "number");

    if (!itemPeriodEnds.length) {
      return null;
    }

    return new Date(Math.max(...itemPeriodEnds) * 1000);
  } catch (error) {
    console.error("Failed to fetch Stripe subscription billing date", error);
    return null;
  }
}

async function buildSettingsStats(userId: string, membershipTier: DatabaseTier) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { signupDate: true },
  });

  type SettingsStat = {
    label: string;
    value: string;
    subValue?: string;
    variant?: "default" | "badge";
  };

  const stats: SettingsStat[] = [
    {
      label: "Member since",
      value: formatDate(user?.signupDate ?? null),
    },
    {
      label: "Current plan",
      value: formatDatabaseTierLabel(membershipTier),
      variant: "badge" as const,
    },
  ];

  if (membershipTier !== "MEMORABLE" && membershipTier !== "ELITE") {
    return stats;
  }

  const [
    swingSubmissionCount,
    mentalSubmissionCount,
    swingResponseCount,
    mentalResponseCount,
    goalCheckinCount,
    coachingFields,
  ] = await Promise.all([
    prisma.swingAnalysisSubmission.count({ where: { userId } }),
    prisma.mentalGameSubmission.count({ where: { userId } }),
    prisma.swingAnalysisSubmission.count({
      where: { userId, status: "COMPLETED", respondedAt: { not: null } },
    }),
    prisma.mentalGameSubmission.count({
      where: { userId, status: "COMPLETED", respondedAt: { not: null } },
    }),
    prisma.goalCheckin.count({ where: { userId } }),
    ensureCoachingSubmissionPeriod(userId),
  ]);

  const availability = coachingFields ? getCoachingSubmissionAvailability(coachingFields) : null;
  const remainingCount = String(availability?.remaining ?? 0);
  const rolloverSubValue =
    membershipTier === "ELITE" && availability?.rolloverCredits
      ? `includes ${availability.rolloverCredits} rollover`
      : undefined;

  stats.push(
    {
      label: "Total coaching submissions",
      value: String(swingSubmissionCount + mentalSubmissionCount),
    },
    {
      label: "Responses received",
      value: String(swingResponseCount + mentalResponseCount),
    },
    {
      label: "Submissions remaining this month",
      value: remainingCount,
      subValue: rolloverSubValue,
    },
    {
      label: "Goal check-ins submitted",
      value: String(goalCheckinCount),
    },
  );

  return stats;
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      membershipTier: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionCancelAtPeriodEnd: true,
    },
  });

  if (!user) {
    redirect("/auth");
  }

  const membershipTier = user.membershipTier as DatabaseTier;
  const lifetimeBasic = isLifetimeBasicMember(membershipTier, user.stripeSubscriptionId);
  const isFreeMember = membershipTier === "FREE";
  const isPaidSubscriptionTier = membershipTier === "MEMORABLE" || membershipTier === "ELITE";
  const stripeBillingDate = lifetimeBasic
    ? null
    : await getStripeBillingDate({
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripeCustomerId: user.stripeCustomerId,
      });
  const nextBillingDate = stripeBillingDate ?? user.subscriptionCurrentPeriodEnd;
  const hasSubscription = Boolean(user.stripeSubscriptionId);
  const isCancelScheduled = user.subscriptionCancelAtPeriodEnd;
  const stats = await buildSettingsStats(session.user.id, membershipTier);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <div className={settingsPageStackClass}>
        <section className={settingsCardClass}>
          <h1 className={settingsPageTitleClass}>Account Settings</h1>
          <p className={settingsSectionDescriptionClass}>
            Manage your player profile, notifications, membership, and account security.
          </p>
        </section>

        <SettingsStatsSummary stats={stats} />

        <PlayerProfileSection />
        <NotificationPreferencesSection />

        <SettingsCard title="Membership and Billing">
          {isFreeMember ? (
            <div className="space-y-4">
              <p className={settingsBodyTextClass}>
                Current plan: <span className={settingsAccentTextClass}>Free Plan</span>
              </p>
              <p className={settingsMutedTextClass}>
                Upgrade to unlock the full drill library, workout programs, and coaching support.
              </p>
              <Link href="/upgrade" className={`inline-flex ${settingsPrimaryButtonClass}`}>
                Upgrade Membership
              </Link>
            </div>
          ) : lifetimeBasic ? (
            <div className="space-y-3">
              <p className={settingsAccentTextClass}>Basic Plan -- Lifetime Access</p>
              <p className={settingsMutedTextClass}>
                Your Basic membership is a one-time purchase with lifetime access to the drill
                library, workout programs, and core training PDFs.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className={settingsBodyTextClass}>
                Current plan:{" "}
                <span className={settingsAccentTextClass}>
                  {formatDatabaseTierLabel(membershipTier)}
                </span>
              </p>
              <p className={settingsMutedTextClass}>
                Subscription status: {user.subscriptionStatus.replaceAll("_", " ")}
              </p>
              <p className={settingsMutedTextClass}>
                Next billing date: {formatDate(nextBillingDate)}
              </p>
              {isCancelScheduled ? (
                <p className={settingsWarningTextClass}>
                  Your subscription is set to cancel at period end.
                </p>
              ) : null}
              {isPaidSubscriptionTier && user.stripeCustomerId ? <ManageBillingButton /> : null}
              {!hasSubscription ? (
                <p className={settingsMutedTextClass}>
                  No active Stripe subscription was found for this account.
                </p>
              ) : (
                <div>
                  <p className={`mb-3 ${settingsMutedTextClass}`}>
                    Canceling stops future billing and keeps your access active through the current
                    cycle.
                  </p>
                  <CancelSubscriptionButton disabled={isCancelScheduled} />
                </div>
              )}
            </div>
          )}
        </SettingsCard>

        <ChangePasswordSection />

        {!isFreeMember ? (
          <ChangeMembershipSection
            currentTier={membershipTier}
            hasSubscription={hasSubscription}
            isLifetimeBasic={lifetimeBasic}
          />
        ) : null}
      </div>
    </div>
  );
}
