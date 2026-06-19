import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { isDatabaseTier } from "@/lib/membership";
import { stripe } from "@/lib/stripe";
import { sendPaymentFailedEmail } from "@/lib/notifications";

function mapPriceIdToTier(priceId?: string | null) {
  if (!priceId) {
    return null;
  }

  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
    return "BASIC";
  }

  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return "PRO";
  }

  if (priceId === process.env.STRIPE_ELITE_PRICE_ID) {
    return "ELITE";
  }

  return null;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const itemPeriodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  if (!itemPeriodEnds.length) {
    return null;
  }

  return new Date(Math.max(...itemPeriodEnds) * 1000);
}

export async function POST(request: Request) {
  const stripeSignature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSignature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook configuration error." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, stripeSignature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const userId = checkoutSession.metadata?.userId ?? checkoutSession.client_reference_id;
    const membershipTier = checkoutSession.metadata?.membershipTier;
    const stripeCustomerId =
      typeof checkoutSession.customer === "string" ? checkoutSession.customer : null;
    const stripeSubscriptionId =
      typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : null;

    if (
      checkoutSession.payment_status === "paid" &&
      userId &&
      membershipTier &&
      isDatabaseTier(membershipTier)
    ) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: {
          membershipTier,
          subscriptionStatus: "ACTIVE",
          stripeCustomerId,
          stripeSubscriptionId,
          subscriptionCancelAtPeriodEnd: false,
        },
      });
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId =
      typeof subscription.customer === "string" ? subscription.customer : undefined;
    const stripeSubscriptionId = subscription.id;
    const stripePriceId = subscription.items.data[0]?.price.id;
    const mappedTier = mapPriceIdToTier(stripePriceId);
    const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    const status =
      event.type === "customer.subscription.deleted" || subscription.status === "canceled"
        ? "CANCELED"
        : cancelAtPeriodEnd
          ? "CANCEL_AT_PERIOD_END"
          : "ACTIVE";

    const data: {
      stripeCustomerId?: string;
      stripeSubscriptionId: string;
      stripePriceId?: string;
      subscriptionCurrentPeriodEnd: Date | null;
      subscriptionCancelAtPeriodEnd: boolean;
      subscriptionStatus: "ACTIVE" | "CANCEL_AT_PERIOD_END" | "CANCELED";
      membershipTier?: "BASIC" | "PRO" | "ELITE";
    } = {
      stripeSubscriptionId,
      subscriptionCurrentPeriodEnd: currentPeriodEnd,
      subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
      subscriptionStatus: status,
    };

    if (stripeCustomerId) {
      data.stripeCustomerId = stripeCustomerId;
    }

    if (stripePriceId) {
      data.stripePriceId = stripePriceId;
    }

    if (mappedTier && status !== "CANCELED") {
      data.membershipTier = mappedTier;
    }

    if (status === "CANCELED") {
      data.membershipTier = "BASIC";
    }

    await prisma.user.updateMany({
      where: {
        OR: [
          { stripeSubscriptionId },
          ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
        ],
      },
      data,
    });
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : null;
    const stripeSubscriptionId =
      typeof (invoice as { subscription?: unknown }).subscription === "string"
        ? ((invoice as { subscription?: string }).subscription ?? null)
        : null;

    if (stripeCustomerId || stripeSubscriptionId) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
            ...(stripeSubscriptionId ? [{ stripeSubscriptionId }] : []),
          ],
        },
        select: {
          email: true,
          name: true,
        },
      });

      if (user?.email) {
        try {
          await sendPaymentFailedEmail({
            toEmail: user.email,
            displayName: user.name ?? user.email,
            amountDueCents: invoice.amount_due,
            currency: invoice.currency,
            invoiceUrl: invoice.hosted_invoice_url,
          });
        } catch (error) {
          console.error("Failed to send payment failed email", error);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
