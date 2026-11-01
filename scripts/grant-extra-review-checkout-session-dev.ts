import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { extraReviewExpiresAt } from "../lib/extra-review-shared";
import { prisma } from "../lib/prisma";
import { getStripe } from "../lib/stripe";

async function main() {
  assertDevOnlyScript("scripts/grant-extra-review-checkout-session-dev.ts");
  const sessionId = process.argv[2]?.trim();
  const email = process.argv[3]?.trim() ?? "founder1@dev.lcbtraining.test";
  if (!sessionId) {
    console.error("Usage: tsx scripts/grant-extra-review-checkout-session-dev.ts <checkout_session_id> [email]");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const ownerId =
    session.metadata?.userId?.trim() ||
    (typeof session.client_reference_id === "string" ? session.client_reference_id.trim() : null);
  if (session.payment_status !== "paid" || session.metadata?.checkoutKind !== "extra_review") {
    throw new Error("Checkout session is not a paid extra review.");
  }
  if (ownerId !== user.id) {
    throw new Error("Checkout session user mismatch.");
  }

  const purchasedAt = session.created ? new Date(session.created * 1000) : new Date();
  const credit = await prisma.extraReviewCredit.upsert({
    where: { stripeCheckoutSessionId: session.id },
    create: {
      userId: user.id,
      purchasedAt,
      expiresAt: extraReviewExpiresAt(purchasedAt),
      stripeCheckoutSessionId: session.id,
    },
    update: {},
  });

  console.log(JSON.stringify({ user: user.email, creditId: credit.id }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
