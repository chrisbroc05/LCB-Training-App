import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBasicOneTimePriceId, stripe } from "@/lib/stripe";

function getBaseUrl(request: Request) {
  const configuredBaseUrl = process.env.NEXTAUTH_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }

  throw new Error("Unable to resolve app base URL for Stripe redirects.");
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = getBaseUrl(request);
    const priceId = getBasicOneTimePriceId();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success&product=playbook`,
      cancel_url: `${baseUrl}/playbook?checkout=cancelled`,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        membershipTier: "BASIC",
        purchaseType: "playbook",
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[stripe-checkout-basic] Failed to create checkout session", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Unable to start Stripe checkout." }, { status: 500 });
  }
}
