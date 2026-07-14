import Stripe from "stripe";
import type { BillingFrequency } from "@/lib/billing";
import type { DatabaseTier } from "@/lib/membership";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required to initialize Stripe.");
}

export const stripe = new Stripe(stripeSecretKey);

type PaidDatabaseTier = Exclude<DatabaseTier, "FREE">;

const stripeMonthlyPriceIds: Record<PaidDatabaseTier, string | undefined> = {
  BASIC: process.env.STRIPE_BASIC_PRICE_ID,
  PRO: process.env.STRIPE_PRO_PRICE_ID,
  ELITE: process.env.STRIPE_ELITE_PRICE_ID,
};

const stripeAnnualPriceIds: Record<PaidDatabaseTier, string | undefined> = {
  BASIC: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID,
  PRO: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  ELITE: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID,
};

export function getSubscriptionPriceId(
  tier: DatabaseTier,
  billingFrequency: BillingFrequency = "monthly",
) {
  if (tier === "FREE") {
    throw new Error("Free tier does not have a Stripe price ID.");
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
