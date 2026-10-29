import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BillingSection from "@/app/settings/BillingSection";
import MyPlanSection from "@/app/settings/MyPlanSection";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipSubscriptionStatusLabel } from "@/lib/membership-change-shared";
import { expirePastDueMembershipGraceForUser } from "@/lib/membership-subscription-grace-server";
import DeleteAccountSection from "@/app/settings/DeleteAccountSection";
import NotificationPreferencesSection from "@/app/settings/NotificationPreferencesSection";
import ProgramEmailSettingsSection from "@/app/settings/ProgramEmailSettingsSection";
import WorkoutEquipmentSection from "@/app/settings/WorkoutEquipmentSection";
import PushNotificationsSection from "@/app/settings/PushNotificationsSection";
import InPersonTrainingSection from "@/app/settings/InPersonTrainingSection";
import OrgTeamSection from "@/app/settings/OrgTeamSection";
import LegalSettingsSection from "@/app/settings/LegalSettingsSection";
import SecuritySection from "@/app/settings/SecuritySection";
import {
  settingsCardClass,
  settingsPageStackClass,
  settingsPageTitleClass,
  settingsSectionDescriptionClass,
} from "@/app/settings/settings-styles";
import { type DatabaseTier } from "@/lib/membership";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { formatMemberPlanLabel } from "@/lib/member-plan-labels-shared";
import { prisma } from "@/lib/prisma";
import { formatMembershipBillingDate, formatOptionalDateTime } from "@/lib/format-date";
import { serializeInPersonTrainingInfo } from "@/lib/in-person-training-shared";
import { getStripe } from "@/lib/stripe";

async function getStripeBillingDate(params: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}) {
  if (!params.stripeSubscriptionId) {
    return null;
  }

  try {
    const subscription = await getStripe().subscriptions.retrieve(params.stripeSubscriptionId);

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

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const checkoutParam = resolvedSearchParams.checkout;
  const membershipCheckoutSuccess =
    checkoutParam === "membership-success" ||
    (Array.isArray(checkoutParam) && checkoutParam.includes("membership-success"));

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      ...userAccessSelect,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionCancelAtPeriodEnd: true,
      termsVersion: true,
      termsAcceptedAt: true,
      acceptedByName: true,
      acceptedAsParent: true,
      mediaConsent: true,
      trainsInPerson: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      medicalNotes: true,
      inPersonInfoUpdatedAt: true,
    },
  });

  if (!user) {
    redirect("/auth");
  }

  if (membershipCheckoutSuccess && user.membershipLevel === "ALL_ACCESS") {
    const enrollment = await prisma.programEnrollment.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompletedAt: true },
    });
    if (!enrollment?.onboardingCompletedAt) {
      redirect("/program/start?checkout=membership-success");
    }
    redirect("/dashboard/today");
  }

  await expirePastDueMembershipGraceForUser(session.user.id);

  const membershipSub = await prisma.membershipSubscription.findUnique({
    where: { userId: session.user.id },
  });

  const membershipTier = user.membershipTier as DatabaseTier;
  const currentPlanLabel = formatMemberPlanLabel(toAccessUserFields(user));
  const stripeBillingDate = await getStripeBillingDate({
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCustomerId: user.stripeCustomerId,
  });
  const nextBillingDate = stripeBillingDate ?? user.subscriptionCurrentPeriodEnd;
  const membershipNextBillingLabel = membershipSub
    ? formatMembershipBillingDate(membershipSub.currentPeriodEnd)
    : "";
  const membershipStatusLabel = membershipSub
    ? formatMembershipSubscriptionStatusLabel({
        status: membershipSub.status,
        cancelAtPeriodEnd: membershipSub.cancelAtPeriodEnd,
        pendingLevel: (membershipSub.pendingLevel as MembershipLevelKey | null) ?? null,
        nextBillingLabel: membershipNextBillingLabel,
      })
    : "";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <div className={settingsPageStackClass}>
        <section className={settingsCardClass}>
          <h1 className={settingsPageTitleClass}>Settings</h1>
          <p className={settingsSectionDescriptionClass}>
            Manage your notification preferences, security, and billing.
          </p>
        </section>

        <NotificationPreferencesSection />
        <PushNotificationsSection />
        <ProgramEmailSettingsSection />
        <WorkoutEquipmentSection />
        <LegalSettingsSection
          termsVersion={user.termsVersion}
          termsAcceptedLabel={formatOptionalDateTime(user.termsAcceptedAt)}
          acceptedByName={user.acceptedByName}
          acceptedAsParent={user.acceptedAsParent}
          mediaConsent={user.mediaConsent}
        />
        <InPersonTrainingSection initialInfo={serializeInPersonTrainingInfo(user)} />
        <OrgTeamSection />
        <SecuritySection />
        {membershipSub ? (
          <MyPlanSection
            level={membershipSub.level as MembershipLevelKey}
            status={membershipSub.status}
            statusLabel={membershipStatusLabel}
            nextBillingLabel={membershipNextBillingLabel}
            cancelAtPeriodEnd={membershipSub.cancelAtPeriodEnd}
            pendingLevel={(membershipSub.pendingLevel as MembershipLevelKey | null) ?? null}
            pendingLevelEffectiveLabel={
              membershipSub.pendingLevel
                ? formatMembershipBillingDate(membershipSub.currentPeriodEnd)
                : null
            }
          />
        ) : null}
        {!membershipSub ? (
          <BillingSection
            currentPlanLabel={currentPlanLabel}
            membershipTier={membershipTier}
            subscriptionStatus={user.subscriptionStatus}
            nextBillingDate={formatMembershipBillingDate(nextBillingDate)}
            isCancelScheduled={user.subscriptionCancelAtPeriodEnd}
            hasSubscription={Boolean(user.stripeSubscriptionId)}
            stripeCustomerId={user.stripeCustomerId}
            stripeSubscriptionId={user.stripeSubscriptionId}
          />
        ) : null}
        <DeleteAccountSection userEmail={user.email} userName={user.name ?? ""} />
      </div>
    </div>
  );
}
