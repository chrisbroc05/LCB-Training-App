import assert from "node:assert/strict";
import { computeRefundCommissionCents } from "../lib/commission-ledger-shared";
import {
  isMembershipPaymentFullyRefunded,
  resolveMembershipRefundAmountPaidCents,
} from "../lib/membership-charge-refund-shared";

assert.equal(
  resolveMembershipRefundAmountPaidCents({
    chargeAmountRefundedCents: 1000,
    paymentAmountPaidCents: 1000,
  }),
  1000,
);

assert.equal(
  resolveMembershipRefundAmountPaidCents({
    chargeAmountRefundedCents: 500,
    paymentAmountPaidCents: 1000,
  }),
  500,
);

assert.equal(
  isMembershipPaymentFullyRefunded({
    chargeAmountRefundedCents: 1000,
    paymentAmountPaidCents: 1000,
  }),
  true,
);

assert.equal(
  computeRefundCommissionCents({
    originalCommissionCents: 141,
    originalAmountPaidCents: 1000,
    refundAmountPaidCents: 1000,
  }),
  -141,
);

assert.equal(
  computeRefundCommissionCents({
    originalCommissionCents: 141,
    originalAmountPaidCents: 1000,
    refundAmountPaidCents: 500,
  }),
  -71,
);

console.log("test-membership-charge-refund-shared: ok");
