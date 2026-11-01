import assert from "node:assert/strict";
import { buildStripeSubscriptionDiscountFields } from "../lib/stripe-subscription-discount-shared";
import { resolveFoundingPlanChangeFlags } from "../lib/founding-plan-change-shared";
import { appendFoundingPriceEndsNotice } from "../lib/founding-offer-shared";
import { buildUpgradeModalContent } from "../lib/membership-change-shared";

const foundingSub = {
  level: "PLUS",
  billingInterval: "MONTHLY",
  foundingDiscountEndsAt: new Date("2027-01-01T00:00:00.000Z"),
};

const upgradeFlags = resolveFoundingPlanChangeFlags({
  subscription: foundingSub,
  changeKind: "upgrade",
  targetLevel: "ALL_ACCESS",
  now: new Date("2026-06-01T00:00:00.000Z"),
});
assert.equal(upgradeFlags.foundingActive, true);
assert.equal(upgradeFlags.foundingPriceEndsWithChange, true);

assert.deepEqual(
  buildStripeSubscriptionDiscountFields({
    clearExistingDiscounts: true,
    applyCouponId: "coupon_test",
  }),
  { discounts: [] },
);

const modal = buildUpgradeModalContent({
  targetLevel: "ALL_ACCESS",
  amountDueTodayDisplay: "$229.00",
  nextBillingLabel: "Jul 1, 2026",
  billingInterval: "MONTHLY",
  foundingPriceEndsWithChange: true,
});
assert.match(modal.body, /Your founding price ends with this change/);

assert.match(
  appendFoundingPriceEndsNotice("Base copy.", true),
  /Your founding price ends with this change/,
);

console.log("test-founding-plan-change-shared: ok");
