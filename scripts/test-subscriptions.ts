import assert from "node:assert/strict";
import {
  compareMembershipLevels,
  isMembershipLevelDowngrade,
  isMembershipLevelUpgrade,
  parseMembershipLevelFromMetadata,
  subscriptionStatusGrantsAccess,
  buildMembershipSubscriptionGraceExpiryUpdate,
  membershipRestoresAccessAfterStripeInvoicePaid,
  MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS,
} from "../lib/membership-subscription-shared";
import { mapStripePriceIdToMembershipLevel } from "../lib/stripe-membership-prices-shared";
import { mapStripeSubscriptionStatus } from "../lib/membership-subscription-shared";
import { countsTowardAllAccessProgramCap } from "../lib/all-access-cap-shared";
import {
  buildMembershipUpgradeStripeUpdateOptions,
  buildUpgradeConfirmMessage,
  buildUpgradeModalContent,
  buildDowngradeModalContent,
  formatMembershipSubscriptionStatusLabel,
  shouldApplyMembershipLevelUpgrade,
  MEMBERSHIP_UPGRADE_PAYMENT_BEHAVIOR,
  MEMBERSHIP_UPGRADE_PRORATION_BEHAVIOR,
} from "../lib/membership-change-shared";
import {
  expectedCancelStateAfterPlanAction,
  membershipContinuityUpdateClearsPeriodEndFlag,
  subscriptionCancelStateMatchesAction,
  MEMBERSHIP_SUBSCRIPTION_BILLING_MODE,
} from "../lib/stripe-membership-lifecycle-shared";

process.env.STRIPE_PRICE_CORE_MONTHLY = "price_1UVGepL5cHzuQyqZsraujEIy";
process.env.STRIPE_PRICE_PLUS_MONTHLY = "price_1UVGfsL5cHzuQyqZIGgawuzY";
process.env.STRIPE_PRICE_ALL_ACCESS_MONTHLY = "price_1UVGgFL5cHzuQyqZXkM0cgX8";

function testPriceMapping() {
  assert.equal(mapStripePriceIdToMembershipLevel("price_1UVGepL5cHzuQyqZsraujEIy"), "CORE");
  assert.equal(mapStripePriceIdToMembershipLevel("price_1UVGfsL5cHzuQyqZIGgawuzY"), "PLUS");
  assert.equal(mapStripePriceIdToMembershipLevel("price_1UVGgFL5cHzuQyqZXkM0cgX8"), "ALL_ACCESS");
  assert.equal(mapStripePriceIdToMembershipLevel("price_legacy"), null);
}

function testLevelCompare() {
  assert.ok(isMembershipLevelUpgrade("CORE", "PLUS"));
  assert.ok(isMembershipLevelDowngrade("ALL_ACCESS", "CORE"));
  assert.equal(compareMembershipLevels("PLUS", "PLUS"), 0);
}

function testMetadataParse() {
  assert.equal(parseMembershipLevelFromMetadata("plus"), "PLUS");
  assert.equal(parseMembershipLevelFromMetadata("bad"), null);
}

function testAccessGrants() {
  const future = new Date(Date.now() + 86400000);
  const past = new Date(Date.now() - 86400000);
  assert.ok(
    subscriptionStatusGrantsAccess("ACTIVE", {
      currentPeriodEnd: future,
      pastDueGraceEndsAt: null,
    }),
  );
  assert.ok(
    subscriptionStatusGrantsAccess("CANCEL_AT_PERIOD_END", {
      currentPeriodEnd: future,
      pastDueGraceEndsAt: null,
    }),
  );
  assert.ok(
    subscriptionStatusGrantsAccess("PAST_DUE", {
      currentPeriodEnd: future,
      pastDueGraceEndsAt: future,
    }),
  );
  assert.equal(
    subscriptionStatusGrantsAccess("PAST_DUE", {
      currentPeriodEnd: future,
      pastDueGraceEndsAt: past,
    }),
    false,
  );
}

function testGraceExpiryKeepsSubscriptionRow() {
  const graceEnd = new Date("2026-11-03T12:00:00.000Z");
  const endedAt = new Date("2026-11-03T12:00:01.000Z");
  const update = buildMembershipSubscriptionGraceExpiryUpdate(graceEnd, endedAt);
  assert.equal(update.status, "EXPIRED");
  assert.equal(update.pastDueGraceEndsAt.toISOString(), graceEnd.toISOString());
  assert.equal(update.accessEndedAt.toISOString(), endedAt.toISOString());
  assert.equal(
    subscriptionStatusGrantsAccess("EXPIRED", {
      currentPeriodEnd: new Date("2027-01-01T00:00:00.000Z"),
      pastDueGraceEndsAt: graceEnd,
    }),
    false,
  );
}

function testInvoicePaidRestoresAccessAfterGraceExpired() {
  const future = new Date(Date.now() + 86400000);
  assert.equal(
    membershipRestoresAccessAfterStripeInvoicePaid({
      stripeStatus: "active",
      currentPeriodEnd: future,
    }),
    true,
  );
  assert.equal(
    membershipRestoresAccessAfterStripeInvoicePaid({
      stripeStatus: "past_due",
      currentPeriodEnd: future,
    }),
    false,
  );
  assert.equal(
    subscriptionStatusGrantsAccess("EXPIRED", {
      currentPeriodEnd: future,
      pastDueGraceEndsAt: null,
    }),
    false,
  );
}

function testGraceStatusMapping() {
  const graceEnd = new Date(Date.now() + MEMBERSHIP_SUBSCRIPTION_GRACE_DAYS * 86400000);
  assert.equal(
    mapStripeSubscriptionStatus({
      stripeStatus: "past_due",
      cancelAtPeriodEnd: false,
      deleted: false,
      pastDueGraceEndsAt: graceEnd,
    }),
    "PAST_DUE",
  );
}

function testDuplicateWebhookIdempotencyConcept() {
  const seen = new Set<string>();
  const first = !seen.has("evt_1") && (seen.add("evt_1"), true);
  const second = !seen.has("evt_1") && (seen.add("evt_1"), true);
  assert.equal(first, true);
  assert.equal(second, false);
}

testPriceMapping();
testLevelCompare();
testMetadataParse();
testAccessGrants();
testGraceExpiryKeepsSubscriptionRow();
testInvoicePaidRestoresAccessAfterGraceExpired();
testGraceStatusMapping();
testDuplicateWebhookIdempotencyConcept();

function testAllAccessCapTwelveWeek() {
  const now = new Date("2026-06-01T12:00:00Z");
  assert.equal(
    countsTowardAllAccessProgramCap({
      membershipTier: "TWELVE_WEEK",
      programEnrollmentStatus: "ACTIVE",
      programPlanMode: "FIXED_12_WEEK",
      twelveWeekProgramEndsAt: new Date("2026-08-01"),
      now,
    }),
    true,
  );
  assert.equal(
    countsTowardAllAccessProgramCap({
      membershipTier: "TWELVE_WEEK",
      programEnrollmentStatus: "COMPLETED",
      programPlanMode: "FIXED_12_WEEK",
      twelveWeekProgramEndsAt: new Date("2026-08-01"),
      now,
    }),
    false,
  );
  assert.equal(
    countsTowardAllAccessProgramCap({
      membershipTier: "TWELVE_WEEK",
      programEnrollmentStatus: "ACTIVE",
      programPlanMode: "FIXED_12_WEEK",
      twelveWeekProgramEndsAt: new Date("2026-05-01"),
      now,
    }),
    false,
  );
  assert.equal(
    countsTowardAllAccessProgramCap({
      membershipTier: "TWELVE_WEEK",
      programEnrollmentStatus: "ACTIVE",
      programPlanMode: "OPEN_ENDED",
      twelveWeekProgramEndsAt: null,
      now,
    }),
    false,
  );
}

testAllAccessCapTwelveWeek();

function testImmediateUpgradeChargeOptions() {
  const options = buildMembershipUpgradeStripeUpdateOptions();
  assert.equal(options.proration_behavior, MEMBERSHIP_UPGRADE_PRORATION_BEHAVIOR);
  assert.equal(options.payment_behavior, MEMBERSHIP_UPGRADE_PAYMENT_BEHAVIOR);
  assert.equal(MEMBERSHIP_UPGRADE_PRORATION_BEHAVIOR, "always_invoice");
  assert.equal(MEMBERSHIP_UPGRADE_PAYMENT_BEHAVIOR, "error_if_incomplete");
}

function testFailedUpgradeDoesNotApplyLevel() {
  assert.equal(
    shouldApplyMembershipLevelUpgrade({
      stripeSubscriptionStatus: "active",
      latestInvoiceStatus: "paid",
    }),
    true,
  );
  assert.equal(
    shouldApplyMembershipLevelUpgrade({
      stripeSubscriptionStatus: "active",
      latestInvoiceStatus: "open",
    }),
    false,
  );
  assert.equal(
    shouldApplyMembershipLevelUpgrade({
      stripeSubscriptionStatus: "past_due",
      latestInvoiceStatus: "paid",
    }),
    false,
  );
  assert.equal(
    shouldApplyMembershipLevelUpgrade({
      stripeSubscriptionStatus: "incomplete",
      latestInvoiceStatus: null,
    }),
    false,
  );
}

function testUpgradeConfirmCopy() {
  const message = buildUpgradeConfirmMessage({
    targetLevel: "PLUS",
    amountDueTodayDisplay: "$9.67",
    nextBillingLabel: "Nov 27, 2026",
  });
  assert.match(message, /Upgrade to Plus\?/);
  assert.match(message, /\$9\.67 today/);
  assert.match(message, /\$20\/mo starting Nov 27, 2026/);

  const modal = buildUpgradeModalContent({
    targetLevel: "PLUS",
    amountDueTodayDisplay: "$10.00",
    nextBillingLabel: "Nov 27, 2026",
  });
  assert.equal(modal.title, "Upgrade to Plus");
  assert.match(modal.body, /\$10\.00 today/);
  assert.equal(modal.confirmLabel, "Upgrade now");
  assert.equal(modal.successMessage, "You're on Plus now.");

  const downgradeModal = buildDowngradeModalContent({
    currentLevel: "PLUS",
    targetLevel: "CORE",
    effectiveDateLabel: "Nov 27, 2026",
  });
  assert.equal(downgradeModal.dismissLabel, "Keep Plus");
  assert.match(downgradeModal.body, /won't be charged anything today/);
}

function testFriendlyStatusLabels() {
  assert.equal(
    formatMembershipSubscriptionStatusLabel({
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      pendingLevel: null,
      nextBillingLabel: "Nov 27, 2026",
    }),
    "Active",
  );
  assert.equal(
    formatMembershipSubscriptionStatusLabel({
      status: "CANCEL_AT_PERIOD_END",
      cancelAtPeriodEnd: true,
      pendingLevel: null,
      nextBillingLabel: "Nov 27, 2026",
    }),
    "Canceling Nov 27, 2026",
  );
  assert.equal(
    formatMembershipSubscriptionStatusLabel({
      status: "PAST_DUE",
      cancelAtPeriodEnd: false,
      pendingLevel: null,
      nextBillingLabel: "Nov 27, 2026",
    }),
    "Payment issue",
  );
  assert.equal(
    formatMembershipSubscriptionStatusLabel({
      status: "EXPIRED",
      cancelAtPeriodEnd: false,
      pendingLevel: null,
      nextBillingLabel: "Nov 27, 2026",
    }),
    "Access ended",
  );
}

function testMembershipBillingModeClassic() {
  assert.equal(MEMBERSHIP_SUBSCRIPTION_BILLING_MODE.type, "classic");
}

function testLifecycleCancelExpectations() {
  const continuityActions = [
    "signup",
    "upgrade",
    "schedule_downgrade",
    "keep_current_level",
    "resume_membership",
  ] as const;
  for (const action of continuityActions) {
    assert.equal(
      subscriptionCancelStateMatchesAction(action, { cancelAt: null, cancelAtPeriodEnd: false }),
      true,
    );
    assert.equal(
      subscriptionCancelStateMatchesAction(action, { cancelAt: 1_800_000_000, cancelAtPeriodEnd: false }),
      false,
      action,
    );
    assert.equal(
      subscriptionCancelStateMatchesAction(action, { cancelAt: null, cancelAtPeriodEnd: true }),
      false,
      action,
    );
  }

  assert.equal(
    subscriptionCancelStateMatchesAction("cancel_membership", {
      cancelAt: 1_800_000_000,
      cancelAtPeriodEnd: true,
    }),
    true,
  );

  const upgradeUpdate = buildMembershipUpgradeStripeUpdateOptions();
  assert.ok(membershipContinuityUpdateClearsPeriodEndFlag(upgradeUpdate));
  assert.deepEqual(expectedCancelStateAfterPlanAction("resume_membership"), {
    allowCancelAtTimestamp: false,
    allowCancelAtPeriodEnd: false,
  });
}

testImmediateUpgradeChargeOptions();
testFailedUpgradeDoesNotApplyLevel();
testUpgradeConfirmCopy();
testFriendlyStatusLabels();
testMembershipBillingModeClassic();
testLifecycleCancelExpectations();

console.log("test-subscriptions: all passed");
