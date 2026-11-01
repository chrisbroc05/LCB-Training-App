import assert from "node:assert/strict";
import {
  isMembershipPaymentReadyForCommissionLedger,
  resolveMembershipPaymentUserId,
} from "../lib/membership-payment-commission-shared";

assert.equal(
  resolveMembershipPaymentUserId({
    subscriptionUserId: null,
    stripeCustomerUserId: "user_from_customer",
    existingPaymentUserId: null,
  }),
  "user_from_customer",
);

assert.equal(
  resolveMembershipPaymentUserId({
    subscriptionUserId: "user_from_sub",
    stripeCustomerUserId: "user_from_customer",
    existingPaymentUserId: "user_existing",
  }),
  "user_from_sub",
);

assert.equal(
  isMembershipPaymentReadyForCommissionLedger({
    userId: null,
    level: "CORE",
    amountPaidCents: 1000,
  }),
  false,
);

assert.equal(
  isMembershipPaymentReadyForCommissionLedger({
    userId: "u1",
    level: "CORE",
    amountPaidCents: 1000,
  }),
  true,
);

// invoice.paid before subscription row: customer user id is enough to record payment + commission later.
assert.equal(
  isMembershipPaymentReadyForCommissionLedger({
    userId: resolveMembershipPaymentUserId({
      subscriptionUserId: null,
      stripeCustomerUserId: "central-user",
      existingPaymentUserId: null,
    }),
    level: "CORE",
    amountPaidCents: 1000,
  }),
  true,
);

console.log("test-membership-payment-commission-shared: ok");
