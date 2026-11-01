import assert from "node:assert/strict";
import {
  buildAdminAnnualMembershipRefundSummary,
  buildAdminMembershipBillingLine,
  buildAdminMembershipPendingChangeNotices,
} from "../lib/admin-membership-subscription-shared";
import { formatMembershipLevelLabel } from "../lib/membership-levels-shared";

assert.equal(formatMembershipLevelLabel("CORE"), "Core");

assert.equal(
  buildAdminMembershipBillingLine({ level: "CORE", billingInterval: "ANNUAL" }),
  "Billing: Annual ($100/yr)",
);
assert.equal(
  buildAdminMembershipBillingLine({ level: "CORE", billingInterval: "MONTHLY" }),
  "Billing: Monthly ($10/mo)",
);

const paidAt = new Date("2026-10-30T12:00:00.000Z");
const refundSummary = buildAdminAnnualMembershipRefundSummary({
  subscriptionBillingInterval: "ANNUAL",
  subscriptionStatus: "ACTIVE",
  payments: [
    {
      id: "p1",
      billingInterval: "ANNUAL",
      amountPaidCents: 10_000,
      paidAt,
      annualRefundEligibleUntil: new Date("2026-11-13T12:00:00.000Z"),
      refundedAt: null,
    },
  ],
  memberDisplayName: "Annual Test",
  now: new Date("2026-10-31T12:00:00.000Z"),
});
assert.ok(refundSummary?.canRefund);
assert.match(refundSummary!.refundWindowLabel!, /Refund window ends/);
assert.match(refundSummary!.confirmMessage, /Refund \$100\.00 to Annual Test/);

const closedSummary = buildAdminAnnualMembershipRefundSummary({
  subscriptionBillingInterval: "ANNUAL",
  subscriptionStatus: "ACTIVE",
  payments: [
    {
      id: "p1",
      billingInterval: "ANNUAL",
      amountPaidCents: 10_000,
      paidAt: new Date("2026-09-01T12:00:00.000Z"),
      annualRefundEligibleUntil: new Date("2026-09-15T12:00:00.000Z"),
      refundedAt: null,
    },
  ],
  memberDisplayName: "Annual Test",
  now: new Date("2026-10-30T12:00:00.000Z"),
});
assert.equal(closedSummary?.canRefund, false);
assert.ok(closedSummary?.refundWindowLabel);
assert.match(closedSummary!.refundWindowLabel as string, /Refund window closed on/);

const refundedSummary = buildAdminAnnualMembershipRefundSummary({
  subscriptionBillingInterval: "ANNUAL",
  subscriptionStatus: "CANCELED",
  accessEndedAt: new Date("2026-10-30T14:00:00.000Z"),
  payments: [
    {
      id: "p-refunded",
      billingInterval: "ANNUAL",
      amountPaidCents: 10_000,
      paidAt: new Date("2026-10-01T12:00:00.000Z"),
      annualRefundEligibleUntil: new Date("2026-10-15T12:00:00.000Z"),
      refundedAt: new Date("2026-10-30T13:00:00.000Z"),
    },
  ],
  memberDisplayName: "Refunded Member",
  now: new Date("2026-10-31T12:00:00.000Z"),
});
assert.equal(refundedSummary?.canRefund, false);
assert.equal(refundedSummary?.refundWindowLabel, null);
assert.deepEqual(refundedSummary?.refundLines, ["Refunded $100.00 on Oct 30, 2026"]);

const switchSummary = buildAdminAnnualMembershipRefundSummary({
  subscriptionBillingInterval: "ANNUAL",
  subscriptionStatus: "ACTIVE",
  payments: [
    {
      id: "p-switch",
      billingInterval: "MONTHLY",
      amountPaidCents: 9000,
      paidAt,
      annualRefundEligibleUntil: new Date("2026-11-13T12:00:00.000Z"),
      refundedAt: null,
      invoiceBillingReason: null,
    },
  ],
  memberDisplayName: "Annual Switch",
  now: new Date("2026-10-31T12:00:00.000Z"),
});
assert.ok(switchSummary?.canRefund);

const notices = buildAdminMembershipPendingChangeNotices({
  level: "CORE",
  billingInterval: "ANNUAL",
  cancelAtPeriodEnd: false,
  pendingLevel: "PLUS",
  pendingBillingInterval: null,
  currentPeriodEndLabel: "Oct 30, 2027",
});
assert.equal(notices.length, 1);
assert.match(notices[0]!, /Switching to Plus/);

console.log("test-admin-membership-subscription-shared: ok");
