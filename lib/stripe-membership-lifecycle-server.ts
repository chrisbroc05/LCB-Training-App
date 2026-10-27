import "server-only";

import type Stripe from "stripe";
import { buildClearMembershipCancellationUpdate } from "@/lib/stripe-membership-lifecycle-shared";
import { getStripe } from "@/lib/stripe";

export async function clearMembershipSubscriptionCancellation(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  // Stripe rejects cancel_at and cancel_at_period_end in one request.
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
  return stripe.subscriptions.update(subscriptionId, { cancel_at: null });
}
