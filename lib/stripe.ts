import Stripe from "stripe";
import type { DatabaseTier } from "@/lib/membership";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required to initialize Stripe.");
}

export const stripe = new Stripe(stripeSecretKey);

const stripePriceIds: Record<DatabaseTier, string | undefined> = {
  BASIC: process.env.STRIPE_BASIC_PRICE_ID,
  PRO: process.env.STRIPE_PRO_PRICE_ID,
  ELITE: process.env.STRIPE_ELITE_PRICE_ID,
};

export function getSubscriptionPriceId(tier: DatabaseTier) {
  const priceId = stripePriceIds[tier];
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for ${tier}. Configure STRIPE_${tier}_PRICE_ID.`);
  }

  return priceId;
}
