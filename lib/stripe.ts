import Stripe from "stripe";
import type { BillingFrequency } from "@/lib/billing";
import type { DatabaseTier } from "@/lib/membership";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required to initialize Stripe.");
}

export const stripe = new Stripe(stripeSecretKey);

type SubscriptionDatabaseTier = Exclude<DatabaseTier, "FREE" | "BASIC">;

const stripeMonthlyPriceIds: Record<SubscriptionDatabaseTier, string | undefined> = {
  MEMORABLE: process.env.STRIPE_MEMORABLE_PRICE_ID,
  ELITE: process.env.STRIPE_ELITE_PRICE_ID,
};

const stripeAnnualPriceIds: Record<SubscriptionDatabaseTier, string | undefined> = {
  MEMORABLE: process.env.STRIPE_MEMORABLE_ANNUAL_PRICE_ID,
  ELITE: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID,
};

export function getBasicOneTimePriceId() {
  const priceId = process.env.STRIPE_BASIC_PRICE_ID;
  if (!priceId) {
    throw new Error("Missing Stripe price ID for Basic. Configure STRIPE_BASIC_PRICE_ID.");
  }

  return priceId;
}

export function getSubscriptionPriceId(
  tier: DatabaseTier,
  billingFrequency: BillingFrequency = "monthly",
) {
  if (tier === "FREE") {
    throw new Error("Free tier does not have a Stripe price ID.");
  }

  if (tier === "BASIC") {
    throw new Error("Basic tier uses a one-time payment price ID.");
  }

  const priceId =
    billingFrequency === "annual" ? stripeAnnualPriceIds[tier] : stripeMonthlyPriceIds[tier];
  if (!priceId) {
    const suffix = billingFrequency === "annual" ? "_ANNUAL" : "";
    throw new Error(
      `Missing Stripe price ID for ${tier}. Configure STRIPE_${tier}${suffix}_PRICE_ID.`,
    );
  }

  return priceId;
}
