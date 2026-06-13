import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { isDatabaseTier } from "@/lib/membership";
import { stripe } from "@/lib/stripe";

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

    if (
      checkoutSession.payment_status === "paid" &&
      userId &&
      membershipTier &&
      isDatabaseTier(membershipTier)
    ) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { membershipTier },
      });
    }
  }

  return NextResponse.json({ received: true });
}
