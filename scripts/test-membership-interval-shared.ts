import assert from "node:assert/strict";
import { parseMembershipBillingInterval } from "../lib/membership-billing-shared";
import { mapStripePriceIdToMembershipPrice } from "../lib/stripe-membership-prices-shared";

process.env.STRIPE_PRICE_CORE_MONTHLY = "price_core_mo";
process.env.STRIPE_PRICE_CORE_ANNUAL = "price_core_yr";
process.env.STRIPE_PRICE_PLUS_MONTHLY = "price_plus_mo";
process.env.STRIPE_PRICE_PLUS_ANNUAL = "price_plus_yr";
process.env.STRIPE_PRICE_ALL_ACCESS_MONTHLY = "price_aa_mo";

assert.equal(parseMembershipBillingInterval("ANNUAL"), "ANNUAL");
assert.equal(parseMembershipBillingInterval(undefined), "MONTHLY");

const plusMonthly = mapStripePriceIdToMembershipPrice("price_plus_mo");
const plusAnnual = mapStripePriceIdToMembershipPrice("price_plus_yr");
assert.equal(plusMonthly?.interval, "MONTHLY");
assert.equal(plusAnnual?.interval, "ANNUAL");
assert.equal(plusMonthly?.level, "PLUS");
assert.equal(plusAnnual?.level, "PLUS");
assert.notEqual(plusMonthly?.interval, plusAnnual?.interval);

console.log("test-membership-interval-shared: ok");
