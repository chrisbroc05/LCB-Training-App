import assert from "node:assert/strict";
import {
  computeCommissionCents,
  computeCommissionRateForPayment,
  computeRefundCommissionCents,
  computeRefundNetCents,
} from "../lib/commission-ledger-shared";
import { computeNetCentsFromPaidAndFee } from "../lib/stripe-charge-fee-shared";

const org = {
  commissionRate: 0.15,
  commissionMonths: 12,
  ongoingCommissionRate: 0.05,
  commissionEndsAt: null,
};

const joined = new Date("2026-01-15T12:00:00.000Z");

assert.equal(
  computeCommissionRateForPayment({
    org,
    attributionJoinedAt: joined,
    paidAt: new Date("2026-02-01T12:00:00.000Z"),
  }),
  0.15,
);

assert.equal(
  computeCommissionRateForPayment({
    org,
    attributionJoinedAt: joined,
    paidAt: new Date("2027-02-01T12:00:00.000Z"),
  }),
  0.05,
);

assert.equal(computeCommissionCents(941, 0.15), 141);
assert.equal(computeCommissionCents(2000, 0.15), 300);
assert.equal(computeCommissionCents(0, 0.15), 0);

assert.equal(computeNetCentsFromPaidAndFee(1000, 59), 941);

assert.equal(
  computeRefundCommissionCents({
    originalCommissionCents: 141,
    originalAmountPaidCents: 1000,
    refundAmountPaidCents: 500,
  }),
  -71,
);

assert.equal(
  computeRefundNetCents({
    originalNetCents: 941,
    originalAmountPaidCents: 1000,
    refundAmountPaidCents: 1000,
  }),
  -941,
);

console.log("test-commission-ledger-shared: ok");
