import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseTier, type DatabaseTier } from "@/lib/membership";
import { sendMembershipTierChangeEmail } from "@/lib/notifications";
import { getSubscriptionPriceId, stripe } from "@/lib/stripe";

type ChangeTierBody = {
  membershipTier?: string;
};

function getPeriodEndFromSubscription(subscription: {
  items: { data: Array<{ current_period_end?: number | null }> };
}) {
  const periodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  if (!periodEnds.length) {
    return null;
  }

  return new Date(Math.max(...periodEnds) * 1000);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ChangeTierBody;
    const requestedTier = body.membershipTier?.toUpperCase() ?? "";
    if (!isDatabaseTier(requestedTier)) {
      return NextResponse.json({ error: "Invalid membership tier selected." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        membershipTier: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        email: true,
        name: true,
      },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active Stripe subscription was found for this account." },
        { status: 400 },
      );
    }

    if (user.membershipTier === requestedTier) {
      return NextResponse.json({ error: "You are already on this membership tier." }, { status: 400 });
    }

    const newPriceId = getSubscriptionPriceId(requestedTier as DatabaseTier);
    const existingSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    if (
      user.stripeCustomerId &&
      typeof existingSubscription.customer === "string" &&
      existingSubscription.customer !== user.stripeCustomerId
    ) {
      return NextResponse.json({ error: "Subscription ownership verification failed." }, { status: 400 });
    }

    const subscriptionItem = existingSubscription.items.data[0];
    if (!subscriptionItem) {
      return NextResponse.json({ error: "No subscription item found to update." }, { status: 400 });
    }

    if (subscriptionItem.price.id === newPriceId) {
      return NextResponse.json({ error: "Subscription is already set to this price." }, { status: 400 });
    }

    const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
      proration_behavior: "create_prorations",
      items: [
        {
          id: subscriptionItem.id,
          price: newPriceId,
        },
      ],
    });

    const currentPeriodEnd = getPeriodEndFromSubscription(updatedSubscription);
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        membershipTier: requestedTier as DatabaseTier,
        subscriptionStatus: "ACTIVE",
        subscriptionCancelAtPeriodEnd: false,
        stripePriceId: newPriceId,
        subscriptionCurrentPeriodEnd: currentPeriodEnd,
      },
    });

    try {
      await sendMembershipTierChangeEmail({
        toEmail: user.email,
        displayName: user.name ?? user.email,
        newTier: requestedTier as DatabaseTier,
      });
    } catch (emailError) {
      console.error("Failed to send membership tier change email", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to change subscription tier", error);
    return NextResponse.json(
      { error: "Unable to update membership tier right now. Please try again." },
      { status: 500 },
    );
  }
}
