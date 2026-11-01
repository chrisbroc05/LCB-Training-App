import "server-only";

import { canPurchaseExtraReview } from "@/lib/extra-review-server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

function getExtraReviewPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_EXTRA_REVIEW?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_EXTRA_REVIEW_NOT_CONFIGURED");
  }
  return priceId;
}

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

export async function createExtraReviewCheckoutSession(params: {
  request: Request;
  userId: string;
  email: string;
}) {
  const allowed = await canPurchaseExtraReview(params.userId);
  if (!allowed.ok) {
    throw new Error(allowed.reason);
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { stripeCustomerId: true },
  });

  const stripe = getStripe();
  const baseUrl = getBaseUrl(params.request);
  const priceId = getExtraReviewPriceId();

  let customerId = user?.stripeCustomerId ?? null;
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = null;
    }
  }

  const metadata = {
    userId: params.userId,
    checkoutKind: "extra_review",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...(customerId ? { customer: customerId } : { customer_email: params.email }),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/coaching-submissions?extraReview=purchased&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/coaching-submissions?extraReview=cancelled`,
    client_reference_id: params.userId,
    metadata,
  });

  if (!session.url) {
    throw new Error("Stripe checkout session missing URL.");
  }

  return session.url;
}
