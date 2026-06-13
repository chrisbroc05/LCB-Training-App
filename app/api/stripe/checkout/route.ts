import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStripeCatalog, getOrCreateSubscriptionPriceId, stripe } from "@/lib/stripe";
import { isDatabaseTier } from "@/lib/membership";

type CheckoutBody = {
  membershipTier?: string;
};

function getBaseUrl(request: Request) {
  const configuredBaseUrl = process.env.NEXTAUTH_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
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

    const body = (await request.json()) as CheckoutBody;
    const requestedTier = body.membershipTier?.toUpperCase() ?? "";

    if (!isDatabaseTier(requestedTier)) {
      return NextResponse.json({ error: "Invalid membership tier selected." }, { status: 400 });
    }

    const membershipTier = requestedTier;
    await ensureStripeCatalog();
    const priceId = await getOrCreateSubscriptionPriceId(membershipTier);
    const baseUrl = getBaseUrl(request);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/auth?checkout=cancelled`,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        membershipTier,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          membershipTier,
        },
      },
    });

    if (!checkoutSession.id) {
      return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
    }

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch {
    return NextResponse.json({ error: "Unable to start Stripe checkout." }, { status: 500 });
  }
}
