import "server-only";

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

/**
 * Undo a user-initiated "cancel at period end" from My plan (not Stripe test-mode auto-cancel).
 * Stripe rejects cancel_at and cancel_at_period_end in one request.
 */
export async function undoUserScheduledSubscriptionCancellation(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
  return stripe.subscriptions.update(subscriptionId, { cancel_at: null });
}
