import assert from "node:assert/strict";
import {
  computeAnnualRefundEligibleUntil,
  isWithinAnnualMembershipRefundWindow,
  ANNUAL_MEMBERSHIP_REFUND_WINDOW_DAYS,
} from "../lib/membership-annual-refund-shared";
import {
  buildAnnualMembershipRefundPolicyMyPlanNote,
  getMembershipBilledPriceDisplay,
  getMembershipLevelPriceDisplay,
  membershipLevelSupportsAnnualBilling,
  parseMembershipBillingInterval,
} from "../lib/membership-billing-shared";
import { mapStripePriceIdToMembershipPrice } from "../lib/stripe-membership-prices-shared";

assert.equal(ANNUAL_MEMBERSHIP_REFUND_WINDOW_DAYS, 14);

const paidAt = new Date("2026-03-01T12:00:00.000Z");
const until = computeAnnualRefundEligibleUntil(paidAt);
assert.equal(until.toISOString(), "2026-03-15T12:00:00.000Z");
assert.equal(isWithinAnnualMembershipRefundWindow(paidAt, new Date("2026-03-15T12:00:00.000Z")), true);
assert.equal(isWithinAnnualMembershipRefundWindow(paidAt, new Date("2026-03-16T00:00:00.000Z")), false);

assert.equal(parseMembershipBillingInterval("annual"), "ANNUAL");
assert.equal(parseMembershipBillingInterval("monthly"), "MONTHLY");
assert.equal(membershipLevelSupportsAnnualBilling("CORE"), true);
assert.equal(membershipLevelSupportsAnnualBilling("ALL_ACCESS"), false);
assert.match(getMembershipLevelPriceDisplay("CORE", "ANNUAL"), /\$100\/yr/);
assert.equal(getMembershipBilledPriceDisplay({ level: "CORE", billingInterval: "ANNUAL" }), "$100/yr");
assert.equal(
  getMembershipBilledPriceDisplay({ level: "PLUS", billingInterval: "ANNUAL" }),
  "$200/yr",
);
assert.match(
  buildAnnualMembershipRefundPolicyMyPlanNote({ level: "CORE" }),
  /email me at chrisbroc05@gmail.com/,
);
assert.match(
  buildAnnualMembershipRefundPolicyMyPlanNote({ level: "PLUS" }),
  /message me in the app/,
);

process.env.STRIPE_PRICE_CORE_MONTHLY = "price_core_mo_test";
process.env.STRIPE_PRICE_CORE_ANNUAL = "price_core_yr_test";
process.env.STRIPE_PRICE_PLUS_MONTHLY = "price_plus_mo_test";
process.env.STRIPE_PRICE_PLUS_ANNUAL = "price_plus_yr_test";

const mapped = mapStripePriceIdToMembershipPrice("price_core_yr_test");
assert.deepEqual(mapped, { level: "CORE", interval: "ANNUAL" });

console.log("test-membership-annual-shared: ok");
