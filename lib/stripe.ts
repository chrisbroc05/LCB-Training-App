import Stripe from "stripe";
import type { DatabaseTier } from "@/lib/membership";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required to initialize Stripe.");
}

export const stripe = new Stripe(stripeSecretKey);

type StripeTierConfig = {
  productName: string;
  unitAmount: number;
};

const stripeTierConfig: Record<DatabaseTier, StripeTierConfig> = {
  BASIC: {
    productName: "LCB Training Basic Membership",
    unitAmount: 500,
  },
  PRO: {
    productName: "LCB Training Pro Membership",
    unitAmount: 1500,
  },
  ELITE: {
    productName: "LCB Training Elite Membership",
    unitAmount: 2500,
  },
};

const stripeTiers: DatabaseTier[] = ["BASIC", "PRO", "ELITE"];

async function getOrCreateProduct(tier: DatabaseTier) {
  const productList = await stripe.products.list({
    active: true,
    limit: 100,
  });

  const existingProduct = productList.data.find(
    (product) => product.metadata.app === "lcb-training" && product.metadata.tier === tier,
  );

  if (existingProduct) {
    return existingProduct;
  }

  return stripe.products.create({
    name: stripeTierConfig[tier].productName,
    metadata: {
      app: "lcb-training",
      tier,
    },
  });
}

export async function getOrCreateSubscriptionPriceId(tier: DatabaseTier) {
  const product = await getOrCreateProduct(tier);
  const { unitAmount } = stripeTierConfig[tier];

  const existingPrices = await stripe.prices.list({
    active: true,
    product: product.id,
    type: "recurring",
    limit: 100,
  });

  const matchingPrice = existingPrices.data.find(
    (price) =>
      price.currency === "usd" &&
      price.unit_amount === unitAmount &&
      price.recurring?.interval === "month" &&
      price.recurring?.interval_count === 1,
  );

  if (matchingPrice) {
    return matchingPrice.id;
  }

  const newPrice = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: unitAmount,
    recurring: {
      interval: "month",
    },
    metadata: {
      app: "lcb-training",
      tier,
    },
  });

  return newPrice.id;
}

export async function ensureStripeCatalog() {
  await Promise.all(stripeTiers.map((tier) => getOrCreateSubscriptionPriceId(tier)));
}
