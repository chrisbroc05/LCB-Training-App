import { NextResponse } from "next/server";
import Stripe from "stripe";
import { REMOTE_SESSION_CALENDLY_URL } from "@/lib/remote-session-branding";

function getBaseUrl() {
  const configuredBaseUrl = process.env.NEXTAUTH_URL;
  if (!configuredBaseUrl) {
    throw new Error("NEXTAUTH_URL is required for remote checkout redirects.");
  }

  return configuredBaseUrl.replace(/\/$/, "");
}

export async function POST() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_REMOTE_PRICE_ID;

    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Remote session pricing is not configured." },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const baseUrl = getBaseUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: REMOTE_SESSION_CALENDLY_URL,
      cancel_url: `${baseUrl}/remote`,
      metadata: {
        purchaseType: "remote_session",
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
