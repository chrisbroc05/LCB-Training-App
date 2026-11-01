/**
 * Verifies Phase 2B prices share Core/Plus products with monthly prices.
 * Run: set -a && source .env && set +a && npx tsx scripts/verify-sandbox-phase-2b-stripe.ts
 */
import Stripe from "stripe";

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  console.log("Stripe verify using configured secret key (sandbox).");

  const coreMo = process.env.STRIPE_PRICE_CORE_MONTHLY!.trim();
  const coreYr = process.env.STRIPE_PRICE_CORE_ANNUAL!.trim();
  const plusMo = process.env.STRIPE_PRICE_PLUS_MONTHLY!.trim();
  const plusYr = process.env.STRIPE_PRICE_PLUS_ANNUAL!.trim();

  const [pCoreMo, pCoreYr, pPlusMo, pPlusYr] = await Promise.all([
    stripe.prices.retrieve(coreMo),
    stripe.prices.retrieve(coreYr),
    stripe.prices.retrieve(plusMo),
    stripe.prices.retrieve(plusYr),
  ]);

  const prod = (id: string | Stripe.Product | Stripe.DeletedProduct) =>
    typeof id === "string" ? id : id.id;

  const coreProductMo = prod(pCoreMo.product);
  const coreProductYr = prod(pCoreYr.product);
  const plusProductMo = prod(pPlusMo.product);
  const plusProductYr = prod(pPlusYr.product);

  assertSame(coreProductMo, coreProductYr, "Core monthly and annual same product");
  assertSame(plusProductMo, plusProductYr, "Plus monthly and annual same product");

  console.log("Core product:", coreProductMo, "intervals:", pCoreMo.recurring?.interval, pCoreYr.recurring?.interval);
  console.log("Plus product:", plusProductMo, "intervals:", pPlusMo.recurring?.interval, pPlusYr.recurring?.interval);
  console.log("Extra review price:", process.env.STRIPE_PRICE_EXTRA_REVIEW?.trim() ?? "(unset)");
  console.log("Founding coupon:", process.env.STRIPE_COUPON_FOUNDING_PLUS?.trim() ?? "(unset)");
  console.log("verify-sandbox-phase-2b-stripe: ok");
}

function assertSame(a: string, b: string, label: string) {
  if (a !== b) {
    throw new Error(`${label}: ${a} !== ${b}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
