/**
 * Creates Phase 2B sandbox Stripe prices + founding coupon on existing Core/Plus products.
 * Run: npx tsx scripts/create-sandbox-phase-2b-stripe.ts
 */
import Stripe from "stripe";

const CORE_MONTHLY = process.env.STRIPE_PRICE_CORE_MONTHLY?.trim();
const PLUS_MONTHLY = process.env.STRIPE_PRICE_PLUS_MONTHLY?.trim();

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY required");
  }
  if (!CORE_MONTHLY || !PLUS_MONTHLY) {
    throw new Error("Set STRIPE_PRICE_CORE_MONTHLY and STRIPE_PRICE_PLUS_MONTHLY first.");
  }

  const stripe = new Stripe(key);

  const coreMonthly = await stripe.prices.retrieve(CORE_MONTHLY);
  const plusMonthly = await stripe.prices.retrieve(PLUS_MONTHLY);
  const coreProductId =
    typeof coreMonthly.product === "string" ? coreMonthly.product : coreMonthly.product.id;
  const plusProductId =
    typeof plusMonthly.product === "string" ? plusMonthly.product : plusMonthly.product.id;

  const coreAnnual = await stripe.prices.create({
    product: coreProductId,
    currency: "usd",
    unit_amount: 10000,
    recurring: { interval: "year" },
    nickname: "Core annual (Phase 2B)",
  });

  const plusAnnual = await stripe.prices.create({
    product: plusProductId,
    currency: "usd",
    unit_amount: 20000,
    recurring: { interval: "year" },
    nickname: "Plus annual (Phase 2B)",
  });

  const extraReviewProduct = await stripe.products.create({
    name: "Extra coaching review",
    description: "One additional in-depth video review (30-day use window).",
  });

  const extraReviewPrice = await stripe.prices.create({
    product: extraReviewProduct.id,
    currency: "usd",
    unit_amount: 4000,
    nickname: "Extra review one-time",
  });

  const foundingCoupon = await stripe.coupons.create({
    amount_off: 500,
    currency: "usd",
    duration: "repeating",
    duration_in_months: 12,
    name: "Founding Plus monthly ($5 off)",
    metadata: { scope: "plus_monthly_only_enforced_in_app" },
  });

  console.log("\nAdd to .env:\n");
  console.log(`STRIPE_PRICE_CORE_ANNUAL=${coreAnnual.id}`);
  console.log(`STRIPE_PRICE_PLUS_ANNUAL=${plusAnnual.id}`);
  console.log(`STRIPE_PRICE_EXTRA_REVIEW=${extraReviewPrice.id}`);
  console.log(`STRIPE_COUPON_FOUNDING_PLUS=${foundingCoupon.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
