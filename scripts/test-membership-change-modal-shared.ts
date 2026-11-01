import assert from "node:assert/strict";
import {
  buildDowngradeModalContent,
  buildKeepAnnualBillingSuccessMessage,
  buildSwitchToAnnualModalContent,
  buildSwitchToMonthlyModalContent,
  buildUpgradeModalContent,
} from "../lib/membership-change-shared";

const annualUpgrade = buildUpgradeModalContent({
  targetLevel: "PLUS",
  amountDueTodayDisplay: "$90.00",
  nextBillingLabel: "Oct 30, 2027",
  billingInterval: "ANNUAL",
});
assert.match(annualUpgrade.body, /Then it's \$200\/yr starting Oct 30, 2027/);
assert.doesNotMatch(annualUpgrade.body, /\$20\/mo/);

const monthlyUpgrade = buildUpgradeModalContent({
  targetLevel: "PLUS",
  amountDueTodayDisplay: "$10.00",
  nextBillingLabel: "Nov 27, 2026",
  billingInterval: "MONTHLY",
  foundingPlusMonthlyActive: true,
});
assert.match(monthlyUpgrade.body, /founding price/);

const foundingPlusToAllAccess = buildUpgradeModalContent({
  targetLevel: "ALL_ACCESS",
  amountDueTodayDisplay: "$229.00",
  nextBillingLabel: "Nov 27, 2026",
  billingInterval: "MONTHLY",
  foundingPriceEndsWithChange: true,
});
assert.match(foundingPlusToAllAccess.body, /Your founding price ends with this change/);

const annualDowngrade = buildDowngradeModalContent({
  currentLevel: "PLUS",
  targetLevel: "CORE",
  effectiveDateLabel: "Oct 30, 2027",
  billingInterval: "ANNUAL",
});
assert.match(annualDowngrade.body, /switch to Core at \$100\/yr/);

const switchMonthly = buildSwitchToMonthlyModalContent({
  level: "CORE",
  annualThroughDateLabel: "Oct 30, 2027",
});
assert.equal(switchMonthly.title, "Switch to monthly");
assert.match(switchMonthly.body, /keep annual billing through Oct 30, 2027/i);
assert.match(switchMonthly.body, /billed \$10\/mo for Core/);
assert.equal(switchMonthly.confirmLabel, "Switch to monthly");
assert.equal(switchMonthly.dismissLabel, "Keep annual");

const switchAnnual = buildSwitchToAnnualModalContent({
  level: "PLUS",
  amountDueTodayDisplay: "$180.00",
});
assert.equal(switchAnnual.title, "Switch to annual");
assert.match(switchAnnual.body, /charged \$180\.00 today for Plus/);
assert.match(switchAnnual.body, /save 2 months/);

assert.match(buildKeepAnnualBillingSuccessMessage(), /stay on annual billing/i);

console.log("test-membership-change-modal-shared: ok");
