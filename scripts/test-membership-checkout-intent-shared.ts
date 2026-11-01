import assert from "node:assert/strict";
import {
  buildMembershipCheckoutAuthHref,
  isMembershipCheckoutIntentExpired,
  membershipCheckoutIntentStillActive,
  MEMBERSHIP_CHECKOUT_INTENT_TTL_MS,
  parseMembershipCheckoutIntent,
} from "../lib/membership-checkout-intent-shared";

const params = new URLSearchParams(
  "checkout=membership&level=plus&billing=annual&orgCode=DEVCLUB",
);
const intent = parseMembershipCheckoutIntent(params);
assert.deepEqual(intent, {
  level: "PLUS",
  orgCode: "DEVCLUB",
  billingInterval: "ANNUAL",
});

assert.match(
  buildMembershipCheckoutAuthHref("CORE", { billingInterval: "ANNUAL", mode: "signup" }),
  /billing=annual/,
);

const started = new Date("2026-01-01T00:00:00.000Z");
assert.equal(
  isMembershipCheckoutIntentExpired(started, new Date(started.getTime() + MEMBERSHIP_CHECKOUT_INTENT_TTL_MS + 1)),
  true,
);
assert.equal(
  membershipCheckoutIntentStillActive({
    pendingCheckoutLevel: "CORE",
    pendingCheckoutAt: started,
    now: new Date(started.getTime() + 1000),
  }),
  true,
);
assert.equal(
  membershipCheckoutIntentStillActive({
    pendingCheckoutLevel: "CORE",
    pendingCheckoutAt: null,
  }),
  false,
);

console.log("test-membership-checkout-intent-shared: ok");
