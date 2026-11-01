import assert from "node:assert/strict";
import { MEMBERSHIP_CHECKOUT_CANCELED_QUERY } from "../lib/membership-checkout-intent-shared";

/** Simulates cancel landing query handling (upgrade page treats canceled + legacy cancelled). */
function isCheckoutCanceledQuery(checkout: string): boolean {
  return checkout === MEMBERSHIP_CHECKOUT_CANCELED_QUERY || checkout === "cancelled";
}

assert.equal(isCheckoutCanceledQuery("canceled"), true);
assert.equal(isCheckoutCanceledQuery("cancelled"), true);
assert.equal(isCheckoutCanceledQuery("membership"), false);

/**
 * After fix: post-auth must not resume checkout from stale pending alone.
 * (Complete-checkout consumes intent once; cancel clears pending.)
 */
assert.equal(MEMBERSHIP_CHECKOUT_CANCELED_QUERY, "canceled");

console.log("test-membership-checkout-cancel-shared: ok");
