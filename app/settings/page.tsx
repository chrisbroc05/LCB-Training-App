import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DatabaseTier } from "@/lib/membership";
import { stripe } from "@/lib/stripe";
import CancelSubscriptionButton from "@/app/settings/CancelSubscriptionButton";
import ChangeMembershipSection from "@/app/settings/ChangeMembershipSection";
import { isAdminEmail } from "@/lib/admin";

function formatTierLabel(tier: DatabaseTier) {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
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
  if (isAdminEmail(session.user.email)) {
    redirect("/admin");
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

  const stripeBillingDate = await getStripeBillingDate({
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCustomerId: user.stripeCustomerId,
  });
  const nextBillingDate = stripeBillingDate ?? user.subscriptionCurrentPeriodEnd;
  const hasSubscription = Boolean(user.stripeSubscriptionId);
  const isCancelScheduled = user.subscriptionCancelAtPeriodEnd;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Account Settings</h1>
        <p className="mt-2 text-zinc-300">
          Review your current membership details and manage your Stripe subscription.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Membership Tier</h2>
          <p className="mt-3 text-zinc-300">
            Current plan:{" "}
            <span className="font-semibold text-[#98b144]">
              {formatTierLabel(user.membershipTier as DatabaseTier)}
            </span>
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Subscription status: {user.subscriptionStatus.replaceAll("_", " ")}
          </p>
        </article>

        <article className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Next Billing Date</h2>
          <p className="mt-3 text-zinc-300">{formatDate(nextBillingDate)}</p>
          {isCancelScheduled && (
            <p className="mt-2 text-sm text-yellow-200">
              Your subscription is set to cancel at period end.
            </p>
          )}
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Subscription Management</h2>
        <p className="mt-2 text-zinc-300">
          Canceling stops future billing and keeps your access active through the current cycle.
        </p>
        {!hasSubscription ? (
          <p className="mt-4 text-sm text-zinc-400">
            No active Stripe subscription was found for this account.
          </p>
        ) : (
          <div className="mt-4">
            <CancelSubscriptionButton disabled={isCancelScheduled} />
          </div>
        )}
      </section>

      <ChangeMembershipSection
        currentTier={user.membershipTier as DatabaseTier}
        hasSubscription={hasSubscription}
      />
    </div>
  );
}
