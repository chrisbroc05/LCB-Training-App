import assert from "node:assert/strict";
import {
  FOUNDING_PLUS_MONTHLY_DISCOUNT_DISPLAY,
  isActiveFoundingPlusMonthlyMember,
  shouldApplyFoundingPlusMonthlyOffer,
  shouldEndFoundingPlusMonthlyOnPlanChange,
} from "../lib/founding-offer-shared";

const org = {
  foundingOfferEnabled: true,
  foundingOfferDeadline: new Date("2026-12-31T23:59:59.000Z"),
  foundingOfferMonths: 12,
};

assert.equal(
  shouldApplyFoundingPlusMonthlyOffer({
    level: "PLUS",
    billingInterval: "MONTHLY",
    org,
    now: new Date("2026-06-01T00:00:00.000Z"),
  }),
  true,
);

assert.equal(
  shouldApplyFoundingPlusMonthlyOffer({
    level: "PLUS",
    billingInterval: "ANNUAL",
    org,
    now: new Date("2026-06-01T00:00:00.000Z"),
  }),
  false,
);

assert.equal(
  shouldApplyFoundingPlusMonthlyOffer({
    level: "CORE",
    billingInterval: "MONTHLY",
    org,
    now: new Date("2026-06-01T00:00:00.000Z"),
  }),
  false,
);

assert.match(FOUNDING_PLUS_MONTHLY_DISCOUNT_DISPLAY, /\$15\/mo \(founding price\)/);
assert.match(FOUNDING_PLUS_MONTHLY_DISCOUNT_DISPLAY, /then \$20\/mo/);

assert.equal(
  isActiveFoundingPlusMonthlyMember({
    level: "PLUS",
    billingInterval: "MONTHLY",
    foundingDiscountEndsAt: new Date("2027-01-01T00:00:00.000Z"),
    now: new Date("2026-06-01T00:00:00.000Z"),
  }),
  true,
);

assert.equal(
  shouldEndFoundingPlusMonthlyOnPlanChange({
    foundingActive: true,
    changeKind: "upgrade",
    targetLevel: "ALL_ACCESS",
  }),
  true,
);

console.log("test-founding-offer-shared: ok");
