import assert from "node:assert/strict";
import { isRefundableAnnualMembershipPayment } from "../lib/membership-annual-refund-shared";
import {
  resolveMembershipInvoicePaymentForPaidInvoice,
  type MembershipInvoiceLineLike,
} from "../lib/membership-invoice-payment-shared";

process.env.STRIPE_PRICE_CORE_ANNUAL = "price_core_annual_test";
process.env.STRIPE_PRICE_PLUS_MONTHLY = "price_plus_monthly_test";
process.env.STRIPE_PRICE_PLUS_ANNUAL = "price_plus_annual_test";

const paidAt = new Date("2026-10-30T17:02:03.000Z");

const annualCheckoutLines: MembershipInvoiceLineLike[] = [
  { amount: 10_000, priceId: "price_core_annual_test" },
];

const annualCheckout = resolveMembershipInvoicePaymentForPaidInvoice({
  amountPaid: 10_000,
  billingReason: "subscription_create",
  lines: annualCheckoutLines,
  subscriptionBillingInterval: "ANNUAL",
  paidAt,
});
assert.equal(annualCheckout.billingInterval, "ANNUAL");
assert.equal(annualCheckout.level, "CORE");
assert.ok(annualCheckout.annualRefundEligibleUntil);

const switchLines: MembershipInvoiceLineLike[] = [
  { amount: -2000, priceId: "price_plus_monthly_test" },
  { amount: 20_000, priceId: "price_plus_annual_test" },
];

const switchPaidAt = new Date("2026-10-30T17:45:08.000Z");
const switchToAnnual = resolveMembershipInvoicePaymentForPaidInvoice({
  amountPaid: 18_000,
  billingReason: "subscription_update",
  lines: switchLines,
  subscriptionBillingInterval: "MONTHLY",
  paidAt: switchPaidAt,
});
assert.equal(switchToAnnual.billingInterval, "ANNUAL");
assert.equal(switchToAnnual.level, "PLUS");
assert.ok(switchToAnnual.annualRefundEligibleUntil);

assert.equal(
  isRefundableAnnualMembershipPayment(
    {
      amountPaidCents: 18_000,
      billingInterval: "ANNUAL",
      paidAt: switchPaidAt,
      annualRefundEligibleUntil: switchToAnnual.annualRefundEligibleUntil,
      refundedAt: null,
    },
    new Date("2026-10-31T12:00:00.000Z"),
    "ANNUAL",
  ),
  true,
);

console.log("test-membership-invoice-payment-shared: ok");
