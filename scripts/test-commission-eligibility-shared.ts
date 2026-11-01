import assert from "node:assert/strict";
import {
  COMMISSION_INELIGIBLE_CLUB_PAY,
  evaluateExistingFamilyCommissionEligibility,
  resolveCommissionEligibleOnOrgJoin,
} from "../lib/commission-eligibility-shared";

const joinedAt = new Date("2026-03-01T12:00:00.000Z");

assert.deepEqual(
  evaluateExistingFamilyCommissionEligibility({
    orgJoinedAt: joinedAt,
    priorPayingMember: true,
    priorPurchase: false,
    priorLessonWaiverBeforeJoin: false,
  }),
  {
    eligible: false,
    reason: "Existing family: paying member before joining this org.",
  },
);

assert.deepEqual(
  resolveCommissionEligibleOnOrgJoin({
    orgBillingMode: "CLUB_PAY",
    orgCommissionRate: 0.15,
    existingFamily: {
      orgJoinedAt: joinedAt,
      priorPayingMember: false,
      priorPurchase: false,
      priorLessonWaiverBeforeJoin: false,
    },
  }),
  {
    commissionEligible: false,
    commissionIneligibleReason: COMMISSION_INELIGIBLE_CLUB_PAY,
  },
);

const priorPurchaseResult = resolveCommissionEligibleOnOrgJoin({
  orgBillingMode: "FAMILY_PAY",
  orgCommissionRate: 0.15,
  existingFamily: {
    orgJoinedAt: joinedAt,
    priorPayingMember: false,
    priorPurchase: true,
    priorLessonWaiverBeforeJoin: false,
  },
});
assert.equal(priorPurchaseResult.commissionEligible, false);
assert.match(priorPurchaseResult.commissionIneligibleReason ?? "", /prior purchase/i);

assert.deepEqual(
  resolveCommissionEligibleOnOrgJoin({
    orgBillingMode: "FAMILY_PAY",
    orgCommissionRate: 0.15,
    existingFamily: {
      orgJoinedAt: joinedAt,
      priorPayingMember: false,
      priorPurchase: false,
      priorLessonWaiverBeforeJoin: false,
    },
  }),
  { commissionEligible: true, commissionIneligibleReason: null },
);

assert.deepEqual(
  resolveCommissionEligibleOnOrgJoin({
    orgBillingMode: "FAMILY_PAY",
    orgCommissionRate: 0,
    existingFamily: {
      orgJoinedAt: joinedAt,
      priorPayingMember: true,
      priorPurchase: true,
      priorLessonWaiverBeforeJoin: true,
    },
  }),
  { commissionEligible: true, commissionIneligibleReason: null },
);

console.log("test-commission-eligibility-shared: ok");
