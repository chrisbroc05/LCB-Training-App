import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionCancellationEmail } from "@/lib/notifications";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeSubscriptionId: true,
        subscriptionCancelAtPeriodEnd: true,
        name: true,
        email: true,
      },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active Stripe subscription was found for this account." },
        { status: 400 },
      );
    }

    if (user.subscriptionCancelAtPeriodEnd) {
      return NextResponse.json(
        { error: "Subscription is already scheduled for cancellation." },
        { status: 400 },
      );
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    const itemPeriodEnds = subscription.items.data
      .map((item) => item.current_period_end)
      .filter((value): value is number => typeof value === "number");

    if (!itemPeriodEnds.length) {
      return NextResponse.json(
        { error: "Unable to determine subscription end date from Stripe." },
        { status: 500 },
      );
    }

    const currentPeriodEnd = new Date(Math.max(...itemPeriodEnds) * 1000);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionStatus: "CANCEL_AT_PERIOD_END",
        subscriptionCancelAtPeriodEnd: true,
        subscriptionCurrentPeriodEnd: currentPeriodEnd,
      },
    });

    try {
      await sendSubscriptionCancellationEmail({
        toEmail: user.email,
        displayName: user.name ?? user.email,
        effectiveEndDate: currentPeriodEnd,
      });
    } catch (emailError) {
      console.error("Failed to send subscription cancellation email", emailError);
    }

    return NextResponse.json({ success: true, currentPeriodEnd: currentPeriodEnd.toISOString() });
  } catch (error) {
    console.error("Failed to cancel Stripe subscription", error);
    return NextResponse.json(
      { error: "Unable to cancel subscription right now. Please try again." },
      { status: 500 },
    );
  }
}
