import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BillingSection from "@/app/settings/BillingSection";
import DeleteAccountSection from "@/app/settings/DeleteAccountSection";
import NotificationPreferencesSection from "@/app/settings/NotificationPreferencesSection";
import SecuritySection from "@/app/settings/SecuritySection";
import {
  settingsCardClass,
  settingsPageStackClass,
  settingsPageTitleClass,
  settingsSectionDescriptionClass,
} from "@/app/settings/settings-styles";
import { type DatabaseTier } from "@/lib/membership";
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

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
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
  const stripeBillingDate = await getStripeBillingDate({
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCustomerId: user.stripeCustomerId,
  });
  const nextBillingDate = stripeBillingDate ?? user.subscriptionCurrentPeriodEnd;

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
        <SecuritySection />
        <BillingSection
          membershipTier={membershipTier}
          subscriptionStatus={user.subscriptionStatus}
          nextBillingDate={formatDate(nextBillingDate)}
          isCancelScheduled={user.subscriptionCancelAtPeriodEnd}
          hasSubscription={Boolean(user.stripeSubscriptionId)}
          stripeCustomerId={user.stripeCustomerId}
          stripeSubscriptionId={user.stripeSubscriptionId}
        />
        <DeleteAccountSection userEmail={user.email} userName={user.name ?? ""} />
      </div>
    </div>
  );
}
